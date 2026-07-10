#!/usr/bin/env python3
"""Validate the readable Yemot Markdown snapshot and its coverage manifest."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable


TOPIC_ID = re.compile(r"(?m)^Topic ID: `(\d+)`")
SOURCE_KIND = re.compile(r"(?m)^Source kind: `([^`]+)`")
POST_SOURCE = re.compile(r"(?m)^Source: (\S+)$")


def validate_document(name: str, content: str, max_chars: int) -> list[str]:
    errors: list[str] = []
    if not re.search(r"(?m)^# .+", content):
        errors.append(f"{name}: missing title")
    if not TOPIC_ID.search(content):
        errors.append(f"{name}: missing Topic ID")
    if "## Post " not in content:
        errors.append(f"{name}: missing post section")
    sources = POST_SOURCE.findall(content)
    if not sources:
        errors.append(f"{name}: missing post source")
    for source in sources:
        if not source.startswith("https://"):
            errors.append(f"{name}: post source must use HTTPS: {source}")
    if len(content) > max_chars:
        errors.append(f"{name}: {len(content)} characters exceeds maximum {max_chars}")
    return errors


def validate_unique_paths(documents: Iterable[tuple[str, str]]) -> list[str]:
    seen: set[str] = set()
    errors: list[str] = []
    for name, _content in documents:
        if name in seen:
            errors.append(f"duplicate document path: {name}")
        seen.add(name)
    return errors


def collect_topic_keys(documents: Iterable[tuple[str, str]]) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    for _name, content in documents:
        source_match = SOURCE_KIND.search(content)
        topic_match = TOPIC_ID.search(content)
        if source_match and topic_match:
            keys.add((source_match.group(1), topic_match.group(1)))
    return keys


def validate_snapshot(
    references_dir: Path, min_topics: int, min_posts: int, max_chars: int
) -> list[str]:
    snapshot_dir = references_dir / "snapshot"
    manifest_path = references_dir / "source-manifest.json"
    index_path = references_dir / "source-index.md"
    errors: list[str] = []
    if not snapshot_dir.is_dir():
        errors.append("missing snapshot directory")
    for path in (manifest_path, index_path):
        if not path.is_file():
            errors.append(f"missing required file: {path.name}")
    if errors:
        return errors

    paths = sorted(snapshot_dir.glob("*.md"))
    documents = [(path.name, path.read_text(encoding="utf-8")) for path in paths]
    errors.extend(validate_unique_paths(documents))
    for name, content in documents:
        errors.extend(validate_document(name, content, max_chars))

    topic_keys = collect_topic_keys(documents)
    post_urls = {url for _name, content in documents for url in POST_SOURCE.findall(content)}
    if len(topic_keys) < min_topics:
        errors.append(f"topic coverage {len(topic_keys)} is below minimum {min_topics}")
    if len(post_urls) < min_posts:
        errors.append(f"post coverage {len(post_urls)} is below minimum {min_posts}")

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"cannot read manifest: {error}")
        return errors
    if manifest.get("schema_version") != 2:
        errors.append("manifest schema_version must be 2")
    if manifest.get("topic_count") != len(topic_keys):
        errors.append("manifest topic_count does not match snapshot")
    if manifest.get("post_count") != len(post_urls):
        errors.append("manifest post_count does not match snapshot")
    if manifest.get("document_count") != len(documents):
        errors.append("manifest document_count does not match snapshot")
    return errors


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    default_dir = Path(__file__).resolve().parents[1] / "references"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--references-dir", type=Path, default=default_dir)
    parser.add_argument("--min-topics", type=int, default=140)
    parser.add_argument("--min-posts", type=int, default=500)
    parser.add_argument("--max-chars", type=int, default=240_000)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    errors = validate_snapshot(
        args.references_dir, args.min_topics, args.min_posts, args.max_chars
    )
    if errors:
        print("Snapshot validation failed:", file=sys.stderr)
        for error in errors[:50]:
            print(f"- {error}", file=sys.stderr)
        if len(errors) > 50:
            print(f"- ... and {len(errors) - 50} more", file=sys.stderr)
        return 1
    print(f"Snapshot validation passed: {args.references_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
