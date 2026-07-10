#!/usr/bin/env python3
"""Search the readable Yemot Markdown snapshot at post-level granularity."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable


TOKEN_PATTERN = re.compile(r"[0-9A-Za-z_./:=?-]+|[\u0590-\u05FF]+")
SECRET_PATTERN = re.compile(r"(?i)\b(token|password|pass|api[_-]?key)\s*=\s*([^&\s]+)")
POST_HEADING = re.compile(r"(?m)^## Post (.+)$")
SOURCE_LINE = re.compile(r"(?m)^Source: (https://\S+)$")


def iter_post_documents(snapshot_dir: Path) -> Iterable[dict]:
    for path in sorted(snapshot_dir.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        title_match = re.search(r"(?m)^# (.+)$", content)
        title = title_match.group(1).strip() if title_match else path.stem
        matches = list(POST_HEADING.finditer(content))
        for position, match in enumerate(matches):
            start = match.start()
            end = matches[position + 1].start() if position + 1 < len(matches) else len(content)
            block = content[start:end].strip()
            heading = match.group(1).strip()
            parts = [part.strip() for part in heading.split(" — ")]
            authority = next(
                (value for value in ("staff", "topic author", "community reply") if value in parts),
                "unknown",
            )
            source_match = SOURCE_LINE.search(block)
            source_url = source_match.group(1) if source_match else ""
            line_number = content.count("\n", 0, start) + 1
            yield {
                "title": title,
                "heading": heading,
                "authority": authority,
                "source_url": source_url,
                "path": path,
                "line": line_number,
                "text": block,
            }


def tokenize(value: str) -> list[str]:
    return [token.casefold() for token in TOKEN_PATTERN.findall(value)]


def make_snippet(text: str, terms: list[str], radius: int = 240) -> str:
    folded = text.casefold()
    positions = [folded.find(term) for term in terms if folded.find(term) >= 0]
    center = min(positions) if positions else 0
    start = max(0, center - radius)
    end = min(len(text), center + radius)
    snippet = re.sub(r"\s+", " ", text[start:end].strip())
    return ("…" if start else "") + snippet + ("…" if end < len(text) else "")


def score_document(document: dict, query: str, terms: list[str]) -> int:
    title = str(document.get("title", "")).casefold()
    text = str(document.get("text", "")).casefold()
    phrase = query.strip().casefold()
    score = 0
    if phrase and phrase in title:
        score += 30
    if phrase and phrase in text:
        score += 12
    for term in terms:
        if term in title:
            score += 10
        score += min(text.count(term), 8) * 2
    if document.get("authority") == "topic author":
        score += 3
    elif document.get("authority") == "staff":
        score += 4
    return score


def search_documents(documents: Iterable[dict], query: str, limit: int = 8) -> list[dict]:
    terms = tokenize(query)
    if not terms:
        return []
    results = []
    for document in documents:
        score = score_document(document, query, terms)
        if score:
            results.append(
                {
                    "document": document,
                    "score": score,
                    "snippet": make_snippet(document["text"], terms),
                }
            )
    results.sort(
        key=lambda item: (
            -item["score"],
            item["document"]["authority"] == "community reply",
            str(item["document"]["path"]),
            item["document"]["line"],
        )
    )
    return results[: max(0, limit)]


def redact_secrets(value: str) -> str:
    return SECRET_PATTERN.sub(lambda match: f"{match.group(1)}=[REDACTED]", value)


def format_result(result: dict) -> str:
    document = result["document"]
    return "\n".join(
        [
            f"{document['title']} (score {result['score']})",
            f"Authority: {document['authority']}",
            f"File: {document['path']}:{document['line']}",
            f"Source: {document['source_url']}",
            redact_secrets(result["snippet"]),
        ]
    )


def configure_utf8_streams() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            reconfigure(encoding="utf-8", errors="replace")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    default_snapshot = Path(__file__).resolve().parents[1] / "references" / "snapshot"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", help="Hebrew term, module type, setting, message or API command")
    parser.add_argument("--snapshot-dir", type=Path, default=default_snapshot)
    parser.add_argument("--limit", type=int, default=8)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    configure_utf8_streams()
    args = parse_args(argv)
    if not args.snapshot_dir.is_dir():
        print(f"Snapshot directory not found: {args.snapshot_dir}", file=sys.stderr)
        return 1
    results = search_documents(iter_post_documents(args.snapshot_dir), args.query, args.limit)
    if not results:
        print("No matching documentation posts found.")
        return 3
    print("\n\n".join(format_result(result) for result in results))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
