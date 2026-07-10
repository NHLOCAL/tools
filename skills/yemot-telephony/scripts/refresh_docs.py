#!/usr/bin/env python3
"""Refresh the readable Yemot Markdown snapshot from official NodeBB APIs."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import tempfile
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


USER_AGENT = "NHLOCAL-yemot-telephony-skill/1.0"
F2_BASE = "https://f2.freeivr.co.il"
F2_INDEX_TOPIC = 2729
F2_REQUIRED_TOPICS = {55, 56, 2729}
API_FORUM_BASE = "https://apiforum.yemot.tel"
API_FORUM_TOPICS = {97}
DEFAULT_MIN_TOPICS = 140
DEFAULT_MAX_CHARS = 240_000


class MarkdownExtractor(HTMLParser):
    """Convert rendered NodeBB HTML to compact, searchable Markdown."""

    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.parts: list[str] = []
        self.links: list[str] = []
        self.in_pre = False

    def _newline(self, count: int = 1) -> None:
        self.parts.append("\n" * count)

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._newline(2)
            self.parts.append("#" * int(tag[1]) + " ")
        elif tag in {"p", "div", "section", "article", "blockquote"}:
            self._newline(2)
            if tag == "blockquote":
                self.parts.append("> ")
        elif tag == "br":
            self._newline()
        elif tag == "li":
            self._newline()
            self.parts.append("- ")
        elif tag == "pre":
            self._newline(2)
            self.parts.append("```\n")
            self.in_pre = True
        elif tag == "code" and not self.in_pre:
            self.parts.append("`")
        elif tag == "a":
            self.parts.append("[")
            self.links.append(urljoin(self.base_url, values.get("href", "")))
        elif tag in {"th", "td"}:
            self.parts.append(" | ")
        elif tag == "tr":
            self._newline()
        elif tag == "img":
            alt = values.get("alt", "").strip()
            if alt:
                self.parts.append(alt)

    def handle_endtag(self, tag: str) -> None:
        if tag == "pre":
            self.in_pre = False
            self.parts.append("\n```")
            self._newline(2)
        elif tag == "code" and not self.in_pre:
            self.parts.append("`")
        elif tag == "a":
            href = self.links.pop() if self.links else ""
            self.parts.append(f"]({href})")
        elif tag in {"p", "div", "section", "article", "blockquote"}:
            self._newline(2)
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table"}:
            self._newline(2)

    def handle_data(self, data: str) -> None:
        if self.in_pre:
            self.parts.append(data)
        else:
            self.parts.append(re.sub(r"\s+", " ", data))

    def markdown(self) -> str:
        value = html.unescape("".join(self.parts)).replace("\xa0", " ")
        value = re.sub(r"[ \t]+\n", "\n", value)
        value = re.sub(r"\n[ \t]+", "\n", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        return value.strip()


class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.hrefs.append(href)


def normalize_html(content: str, base_url: str) -> str:
    parser = MarkdownExtractor(base_url)
    parser.feed(content or "")
    parser.close()
    return parser.markdown()


def sanitize_snapshot_text(value: str) -> str:
    value = re.sub(
        r"(?i)\btoken\s*=\s*[0-9][0-9:]{3,}",
        "token=<REDACTED>",
        value,
    )
    value = re.sub(
        r"(?i)\b([a-z0-9_]*password)\s*=\s*[0-9]{4,}",
        lambda match: f"{match.group(1)}=<REDACTED>",
        value,
    )
    return value


def extract_index_targets(posts: Iterable[dict], base_url: str) -> dict[str, set]:
    post_ids: set[int] = set()
    topic_ids: set[int] = set()
    external_urls: set[str] = set()
    base_host = urlparse(base_url).netloc
    for post in posts:
        parser = LinkExtractor()
        parser.feed(post.get("content", ""))
        for href in parser.hrefs:
            url = urljoin(base_url, href)
            parsed = urlparse(url)
            post_match = re.search(r"/post/(\d+)", parsed.path)
            topic_match = re.search(r"/topic/(\d+)(?:/|$)", parsed.path)
            if parsed.netloc == base_host and post_match:
                post_ids.add(int(post_match.group(1)))
            elif parsed.netloc == base_host and topic_match:
                topic_ids.add(int(topic_match.group(1)))
            elif parsed.scheme == "https" and parsed.netloc:
                external_urls.add(url)
    return {"post_ids": post_ids, "topic_ids": topic_ids, "external_urls": external_urls}


def parse_post_topic_id(payload: str) -> int | None:
    try:
        location = json.loads(payload)
    except json.JSONDecodeError:
        location = payload
    match = re.search(r"/topic/(\d+)(?:/|$)", str(location))
    return int(match.group(1)) if match else None


def request_text(url: str, timeout: int = 60, attempts: int = 4) -> str:
    delay = 1.0
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8")
        except HTTPError as error:
            if error.code == 418:
                raise RuntimeError(
                    f"HTTP 418 while reading {url}; Netfree filtering may be blocking the source"
                ) from error
            if error.code in {401, 403, 404} or attempt == attempts:
                raise
        except (URLError, TimeoutError, OSError) as error:
            message = str(error).lower()
            if "certificate" in message or "ssl" in message:
                raise RuntimeError(
                    f"TLS/certificate failure while reading {url}; Netfree filtering may be involved"
                ) from error
            if attempt == attempts:
                raise
        time.sleep(delay)
        delay *= 2
    raise RuntimeError(f"unreachable retry state for {url}")


def request_json(url: str, **kwargs):
    return json.loads(request_text(url, **kwargs))


def fetch_topic(base_url: str, topic_id: int) -> dict:
    first = request_json(f"{base_url}/api/topic/{topic_id}?page=1")
    pages = int(first.get("pagination", {}).get("pageCount") or 1)
    posts = list(first.get("posts", []))
    for page in range(2, pages + 1):
        posts.extend(request_json(f"{base_url}/api/topic/{topic_id}?page={page}").get("posts", []))
    first["posts"] = posts
    first["retrieved_pages"] = pages
    return first


def resolve_post_topic(base_url: str, post_id: int) -> int | None:
    return parse_post_topic_id(request_text(f"{base_url}/api/post/{post_id}"))


def fetch_topics(base_url: str, topic_ids: set[int], workers: int) -> tuple[list[dict], list[dict]]:
    topics: list[dict] = []
    failures: list[dict] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_topic, base_url, topic_id): topic_id for topic_id in topic_ids}
        for future in as_completed(futures):
            topic_id = futures[future]
            try:
                topics.append(future.result())
            except Exception as error:
                failures.append({"topic_id": topic_id, "error": str(error)})
    topics.sort(key=lambda item: int(item.get("tid") or 0))
    failures.sort(key=lambda item: item["topic_id"])
    return topics, failures


def safe_slug(value: str, fallback: str) -> str:
    value = value.split("/", 1)[-1]
    value = unicodedata.normalize("NFC", html.unescape(value)).strip().lower()
    value = re.sub(r"[^\w\u0590-\u05FF-]+", "-", value, flags=re.UNICODE)
    value = re.sub(r"[-_]{2,}", "-", value).strip("-_")
    return (value or fallback)[:80].rstrip("-_")


def authority_label(post: dict, topic_author_id) -> str:
    user = post.get("user") or {}
    if any(user.get(key) for key in ("administrator", "isAdmin", "isModerator", "moderator")):
        return "staff"
    if post.get("uid") == topic_author_id or int(post.get("index") or 0) == 0:
        return "topic author"
    return "community reply"


def select_documentation_posts(
    topic: dict,
    source_kind: str,
    linked_post_ids: set[int],
    linked_topic_ids: set[int],
    full_topic_ids: set[int],
) -> dict:
    """Keep the documented surface and remove unrelated forum discussion."""
    topic_id = int(topic.get("tid") or 0)
    posts = list(topic.get("posts", []))
    if source_kind != "f2" or topic_id in full_topic_ids or topic_id in linked_topic_ids:
        selected_posts = posts
    else:
        topic_author_id = topic.get("uid")
        if topic_author_id is None and posts:
            topic_author_id = posts[0].get("uid")
        selected_posts = [
            post
            for post in posts
            if int(post.get("pid") or 0) in linked_post_ids
            or authority_label(post, topic_author_id) in {"staff", "topic author"}
        ]
    selected = dict(topic)
    selected["posts"] = selected_posts
    return selected


def expand_referenced_post_ids(
    topics: list[dict],
    initial_post_ids: set[int],
    linked_topic_ids: set[int],
    full_topic_ids: set[int],
    base_url: str,
) -> set[int]:
    """Follow post links from already selected documentation until stable."""
    available_ids = {
        int(post.get("pid") or 0)
        for topic in topics
        for post in topic.get("posts", [])
    }
    selected_ids = set(initial_post_ids)
    while True:
        discovered: set[int] = set()
        for topic in topics:
            selected_topic = select_documentation_posts(
                topic,
                "f2",
                selected_ids,
                linked_topic_ids,
                full_topic_ids,
            )
            targets = extract_index_targets(selected_topic.get("posts", []), base_url)
            discovered.update(targets["post_ids"] & available_ids)
        expanded = selected_ids | discovered
        if expanded == selected_ids:
            return selected_ids
        selected_ids = expanded


def split_text(value: str, limit: int) -> list[str]:
    if len(value) <= limit:
        return [value]
    lines = value.splitlines(keepends=True)
    chunks: list[str] = []
    current = ""
    for line in lines:
        if len(line) > limit:
            if current:
                chunks.append(current.rstrip())
                current = ""
            for start in range(0, len(line), limit):
                chunks.append(line[start : start + limit].rstrip())
        elif current and len(current) + len(line) > limit:
            chunks.append(current.rstrip())
            current = line
        else:
            current += line
    if current.strip():
        chunks.append(current.rstrip())
    return chunks


def render_topic_documents(
    topic: dict, source_kind: str, base_url: str, max_chars: int = DEFAULT_MAX_CHARS
) -> dict[str, str]:
    topic_id = int(topic.get("tid") or 0)
    title = html.unescape(str(topic.get("title") or f"Topic {topic_id}")).strip()
    slug = safe_slug(str(topic.get("slug") or title), str(topic_id))
    base_name = f"{source_kind}-{topic_id}-{slug}"
    topic_url = f"{base_url}/topic/{topic_id}"
    header = (
        f"# {title}\n\n"
        f"Source kind: `{source_kind}`\n"
        f"Topic ID: `{topic_id}`\n"
        f"Topic source: {topic_url}\n"
    )
    posts = topic.get("posts", [])
    topic_author_id = topic.get("uid")
    if topic_author_id is None and posts:
        topic_author_id = posts[0].get("uid")

    sections: list[str] = []
    for post in posts:
        user = post.get("user") or {}
        author = str(user.get("displayname") or user.get("username") or "unknown")
        post_id = int(post.get("pid") or 0)
        post_index = int(post.get("index") or 0)
        authority = authority_label(post, topic_author_id)
        published = post.get("timestampISO") or "unknown"
        updated = post.get("editedISO") or published
        post_url = f"{base_url}/post/{post_id}"
        body = sanitize_snapshot_text(normalize_html(post.get("content", ""), base_url))
        meta_template = (
            f"## Post {post_index} — {author} — {authority}{{continuation}}\n\n"
            f"Post ID: `{post_id}`\n"
            f"Published: `{published}`\n"
            f"Updated: `{updated}`\n"
            f"Source: {post_url}\n\n"
        )
        body_limit = max(80, max_chars - len(header) - len(meta_template) - 80)
        body_parts = split_text(body, body_limit)
        for part_number, body_part in enumerate(body_parts, 1):
            continuation = ""
            if len(body_parts) > 1:
                continuation = f" — content part {part_number}/{len(body_parts)}"
            sections.append(meta_template.format(continuation=continuation) + body_part + "\n")

    pages: list[str] = []
    current = header
    for section in sections:
        if current != header and len(current) + len(section) > max_chars:
            pages.append(current.rstrip() + "\n")
            current = header + "\n" + section
        else:
            current += "\n" + section
    if current.strip():
        pages.append(current.rstrip() + "\n")

    if len(pages) == 1:
        return {f"{base_name}.md": pages[0]}
    width = max(2, len(str(len(pages))))
    return {
        f"{base_name}-part-{index:0{width}d}.md": page
        for index, page in enumerate(pages, 1)
    }


def write_atomic_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    os.close(descriptor)
    temp_path = Path(temp_name)
    try:
        temp_path.write_text(content, encoding="utf-8", newline="\n")
        if path.exists() and path.read_bytes() == temp_path.read_bytes():
            return
        temp_path.replace(path)
    finally:
        temp_path.unlink(missing_ok=True)


def write_snapshot(target: Path, documents: dict[str, str]) -> None:
    target.mkdir(parents=True, exist_ok=True)
    for name, content in sorted(documents.items()):
        write_atomic_text(target / name, content)
    expected = set(documents)
    for path in target.glob("*.md"):
        if path.name not in expected:
            path.unlink()


def build_source_index(manifest: dict) -> str:
    lines = [
        "# Yemot documentation source index",
        "",
        f"Snapshot generated: `{manifest['generated_at']}`",
        "",
        f"Coverage: **{manifest['topic_count']} topics**, **{manifest['post_count']} unique posts**, "
        f"**{manifest['document_count']} Markdown documents**.",
        "",
        "## Source hierarchy",
        "",
        "1. Staff and topic-author posts on Yemot-hosted forums.",
        "2. Other posts on those forums, labelled as community replies.",
        "3. Volatile details must be checked against the linked live source.",
        "",
        "## Topics",
        "",
        "| Source | Topic | Posts | Snapshot | Live source |",
        "|---|---:|---:|---|---|",
    ]
    for topic in manifest["topics"]:
        title = topic["title"].replace("|", "\\|")
        files = ", ".join(f"[{Path(name).stem}](snapshot/{name})" for name in topic["files"])
        lines.append(
            f"| {topic['source_kind']} | {title} | {topic['post_count']} | {files} | "
            f"[source]({topic['url']}) |"
        )
    if manifest["unresolved_post_ids"] or manifest["failed_topics"]:
        lines.extend(["", "## Retrieval notes", ""])
        if manifest["unresolved_post_ids"]:
            values = ", ".join(str(value) for value in manifest["unresolved_post_ids"])
            lines.append(f"Unresolved post links: `{values}`.")
        for failure in manifest["failed_topics"]:
            lines.append(f"- `{failure['source_kind']}:{failure['topic_id']}`: {failure['error']}")
    return "\n".join(lines) + "\n"


def refresh(output_dir: Path, workers: int, min_topics: int, max_chars: int) -> dict:
    index = fetch_topic(F2_BASE, F2_INDEX_TOPIC)
    targets = extract_index_targets(index.get("posts", []), F2_BASE)
    topic_ids = set(targets["topic_ids"]) | set(F2_REQUIRED_TOPICS)
    unresolved: list[int] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(resolve_post_topic, F2_BASE, post_id): post_id
            for post_id in targets["post_ids"]
        }
        for future in as_completed(futures):
            post_id = futures[future]
            try:
                topic_id = future.result()
                if topic_id is None:
                    unresolved.append(post_id)
                else:
                    topic_ids.add(topic_id)
            except Exception:
                unresolved.append(post_id)

    f2_topics, f2_failures = fetch_topics(F2_BASE, topic_ids, workers)
    api_topics, api_failures = fetch_topics(API_FORUM_BASE, set(API_FORUM_TOPICS), workers)
    successful_topic_count = len(f2_topics) + len(api_topics)
    if successful_topic_count < min_topics:
        raise RuntimeError(
            f"refusing to replace snapshot: only {successful_topic_count} topics fetched "
            f"(minimum {min_topics})"
        )

    expanded_post_ids = expand_referenced_post_ids(
        f2_topics,
        targets["post_ids"],
        targets["topic_ids"],
        F2_REQUIRED_TOPICS,
        F2_BASE,
    )

    documents: dict[str, str] = {}
    topic_rows: list[dict] = []
    for source_kind, base_url, topics in (
        ("f2", F2_BASE, f2_topics),
        ("api-forum", API_FORUM_BASE, api_topics),
    ):
        for topic in topics:
            selected_topic = select_documentation_posts(
                topic,
                source_kind,
                expanded_post_ids,
                targets["topic_ids"],
                F2_REQUIRED_TOPICS,
            )
            rendered = render_topic_documents(selected_topic, source_kind, base_url, max_chars)
            overlap = set(documents).intersection(rendered)
            if overlap:
                raise RuntimeError(f"duplicate snapshot filenames: {sorted(overlap)}")
            documents.update(rendered)
            topic_id = int(topic.get("tid") or 0)
            topic_rows.append(
                {
                    "source_kind": source_kind,
                    "topic_id": topic_id,
                    "title": html.unescape(str(topic.get("title") or "")),
                    "post_count": len(selected_topic.get("posts", [])),
                    "url": f"{base_url}/topic/{topic_id}",
                    "files": sorted(rendered),
                }
            )

    failures = [{"source_kind": "f2", **item} for item in f2_failures]
    failures += [{"source_kind": "api-forum", **item} for item in api_failures]
    topic_rows.sort(key=lambda item: (item["source_kind"], item["topic_id"]))
    manifest = {
        "schema_version": 2,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_roots": [
            f"{F2_BASE}/topic/{F2_INDEX_TOPIC}",
            f"{F2_BASE}/topic/55",
            f"{F2_BASE}/topic/56",
            f"{API_FORUM_BASE}/topic/97",
        ],
        "selection_policy": (
            "All posts from central API topics and directly linked topics; otherwise all "
            "explicitly indexed posts, recursively referenced posts, and topic-author/staff "
            "posts. Unlinked discussion replies are excluded."
        ),
        "sanitization_policy": (
            "Numeric values that look like management tokens or passwords are replaced with "
            "<REDACTED>; parameter names, placeholders, and live source links are preserved."
        ),
        "topic_count": successful_topic_count,
        "post_count": sum(row["post_count"] for row in topic_rows),
        "document_count": len(documents),
        "text_char_count": sum(len(content) for content in documents.values()),
        "max_document_chars": max((len(content) for content in documents.values()), default=0),
        "unresolved_post_ids": sorted(unresolved),
        "failed_topics": failures,
        "external_index_urls": sorted(targets["external_urls"]),
        "topics": topic_rows,
    }

    write_snapshot(output_dir / "snapshot", documents)
    write_atomic_text(
        output_dir / "source-manifest.json",
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    )
    write_atomic_text(output_dir / "source-index.md", build_source_index(manifest))
    return manifest


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    default_output = Path(__file__).resolve().parents[1] / "references"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=default_output)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--min-topics", type=int, default=DEFAULT_MIN_TOPICS)
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        manifest = refresh(
            args.output_dir, max(1, args.workers), args.min_topics, max(10_000, args.max_chars)
        )
    except Exception as error:
        print(f"Refresh failed: {error}", file=sys.stderr)
        return 1
    print(
        f"Refreshed {manifest['topic_count']} topics / {manifest['post_count']} posts / "
        f"{manifest['document_count']} Markdown files into {args.output_dir}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
