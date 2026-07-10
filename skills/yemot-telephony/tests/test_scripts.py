import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = SKILL_ROOT / "scripts"


def load_script(name):
    path = SCRIPTS / f"{name}.py"
    if not path.exists():
        raise AssertionError(f"missing script: {path.name}")
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sample_topic(content="<p><code>type=api</code></p>"):
    return {
        "tid": 56,
        "title": "מודול API",
        "slug": "56/api-module",
        "posts": [
            {
                "pid": 700,
                "index": 0,
                "uid": 42,
                "user": {"username": "author"},
                "timestampISO": "2026-01-01T00:00:00.000Z",
                "editedISO": "2026-01-02T00:00:00.000Z",
                "content": content,
            }
        ],
    }


class RefreshDocsTests(unittest.TestCase):
    def setUp(self):
        self.refresh = load_script("refresh_docs")

    def test_normalize_html_preserves_structure_code_and_links(self):
        html = (
            '<h2>מודול API</h2><p>הגדירו <code>type=api</code>.</p>'
            '<ul><li><a href="/post/56">מקור</a></li></ul>'
        )
        text = self.refresh.normalize_html(html, "https://f2.freeivr.co.il")
        self.assertIn("## מודול API", text)
        self.assertIn("`type=api`", text)
        self.assertIn("[מקור](https://f2.freeivr.co.il/post/56)", text)

    def test_snapshot_sanitizer_redacts_credentials_but_keeps_setting_references(self):
        text = (
            "token=0773137770:123456 password=128976 "
            "credit_card_password=128976 password=password_admin password=yes"
        )
        sanitized = self.refresh.sanitize_snapshot_text(text)
        self.assertNotIn("0773137770:123456", sanitized)
        self.assertNotIn("128976", sanitized)
        self.assertIn("token=<REDACTED>", sanitized)
        self.assertIn("credit_card_password=<REDACTED>", sanitized)
        self.assertIn("password=password_admin", sanitized)
        self.assertIn("password=yes", sanitized)

    def test_extract_index_targets_deduplicates_posts_and_topics(self):
        posts = [{"content": (
            '<a href="/post/56">API</a><a href="/post/56">API שוב</a>'
            '<a href="/topic/55/api">ניהול</a><a href="https://example.com/x">חיצוני</a>'
        )}]
        result = self.refresh.extract_index_targets(posts, "https://f2.freeivr.co.il")
        self.assertEqual(result["post_ids"], {56})
        self.assertEqual(result["topic_ids"], {55})
        self.assertEqual(result["external_urls"], {"https://example.com/x"})

    def test_post_location_parser_accepts_nodebb_redirect_payload(self):
        self.assertEqual(
            self.refresh.parse_post_topic_id('"/topic/8082/ivr-settings"'), 8082
        )

    def test_render_topic_document_is_readable_and_source_backed(self):
        documents = self.refresh.render_topic_documents(
            sample_topic(), "f2", "https://f2.freeivr.co.il", max_chars=10000
        )
        self.assertEqual(len(documents), 1)
        name, content = next(iter(documents.items()))
        self.assertEqual(name, "f2-56-api-module.md")
        self.assertIn("# מודול API", content)
        self.assertIn("Topic ID: `56`", content)
        self.assertIn("## Post 0 — author — topic author", content)
        self.assertIn("https://f2.freeivr.co.il/post/700", content)
        self.assertIn("`type=api`", content)
        self.assertNotIn("snapshot generated", content.lower())
        self.assertNotIn("  \n", content)

    def test_render_topic_document_splits_oversized_content(self):
        content = "".join(f"<h2>Section {index}</h2><p>{'x' * 180}</p>" for index in range(12))
        documents = self.refresh.render_topic_documents(
            sample_topic(content), "f2", "https://f2.freeivr.co.il", max_chars=700
        )
        self.assertGreater(len(documents), 1)
        self.assertTrue(all("part-" in name for name in documents))
        self.assertTrue(all(len(text) <= 1000 for text in documents.values()))
        self.assertTrue(all("https://f2.freeivr.co.il/post/700" in text for text in documents.values()))

    def test_write_snapshot_removes_only_stale_markdown(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / "stale.md").write_text("old", encoding="utf-8")
            (target / "keep.txt").write_text("keep", encoding="utf-8")
            self.refresh.write_snapshot(target, {"new.md": "new\n"})
            self.assertFalse((target / "stale.md").exists())
            self.assertEqual((target / "new.md").read_text(encoding="utf-8"), "new\n")
            self.assertTrue((target / "keep.txt").exists())

    def test_selection_keeps_documentation_and_drops_unlinked_discussion(self):
        topic = sample_topic()
        topic["posts"].extend(
            [
                {
                    "pid": 701,
                    "index": 1,
                    "uid": 77,
                    "user": {"username": "linked-helper"},
                    "content": "<p>linked documentation</p>",
                },
                {
                    "pid": 702,
                    "index": 2,
                    "uid": 88,
                    "user": {"username": "random-reply"},
                    "content": "<p>discussion only</p>",
                },
            ]
        )
        selected = self.refresh.select_documentation_posts(
            topic,
            source_kind="f2",
            linked_post_ids={701},
            linked_topic_ids=set(),
            full_topic_ids=set(),
        )
        self.assertEqual([post["pid"] for post in selected["posts"]], [700, 701])

    def test_selection_expands_links_from_selected_documentation(self):
        topic = sample_topic('<p>See <a href="/post/701">queue callback</a></p>')
        topic["posts"].append(
            {
                "pid": 701,
                "index": 1,
                "uid": 77,
                "user": {"username": "helper"},
                "content": "<p>queue_api_send=yes</p>",
            }
        )
        expanded = self.refresh.expand_referenced_post_ids(
            [topic],
            initial_post_ids=set(),
            linked_topic_ids=set(),
            full_topic_ids=set(),
            base_url="https://f2.freeivr.co.il",
        )
        self.assertEqual(expanded, {701})


class SearchDocsTests(unittest.TestCase):
    def setUp(self):
        self.search = load_script("search_docs")

    def make_snapshot(self, directory):
        path = Path(directory) / "f2-56-api-module.md"
        path.write_text(
            "# מודול API\n\n"
            "Topic source: https://f2.freeivr.co.il/topic/56\n\n"
            "## Post 0 — author — topic author\n\n"
            "Source: https://f2.freeivr.co.il/post/700\n\n"
            "הגדירו `type=api` ואת `api_link`.\n\n"
            "## Post 1 — helper — community reply\n\n"
            "Source: https://f2.freeivr.co.il/post/701\n\n"
            "CreateSipAccount is unrelated API content.\n",
            encoding="utf-8",
        )
        return path

    def test_parser_returns_post_level_documents_with_authority(self):
        with tempfile.TemporaryDirectory() as directory:
            self.make_snapshot(directory)
            documents = list(self.search.iter_post_documents(Path(directory)))
        self.assertEqual(len(documents), 2)
        self.assertEqual(documents[0]["authority"], "topic author")
        self.assertEqual(documents[1]["authority"], "community reply")
        self.assertEqual(documents[0]["source_url"], "https://f2.freeivr.co.il/post/700")

    def test_search_ranks_exact_topic_author_match(self):
        with tempfile.TemporaryDirectory() as directory:
            self.make_snapshot(directory)
            documents = list(self.search.iter_post_documents(Path(directory)))
            result = self.search.search_documents(documents, "מודול API type=api", limit=2)
        self.assertEqual(result[0]["document"]["source_url"], "https://f2.freeivr.co.il/post/700")
        self.assertGreater(result[0]["score"], result[1]["score"])

    def test_redaction_masks_credentials_in_rendered_output(self):
        text = "token=0771234567:123456&path=/ password=hunter2"
        redacted = self.search.redact_secrets(text)
        self.assertNotIn("123456", redacted)
        self.assertNotIn("hunter2", redacted)
        self.assertIn("token=[REDACTED]", redacted)

    def test_cli_forces_utf8_with_cp1255_windows_stream(self):
        with tempfile.TemporaryDirectory() as directory:
            path = self.make_snapshot(directory)
            path.write_text(path.read_text(encoding="utf-8") + "arrow ⬆ test\n", encoding="utf-8")
            env = dict(os.environ)
            env["PYTHONIOENCODING"] = "cp1255"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "search_docs.py"),
                    "test",
                    "--snapshot-dir",
                    directory,
                ],
                capture_output=True,
                env=env,
                check=False,
            )
        self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", errors="replace"))
        self.assertIn("⬆", result.stdout.decode("utf-8"))


class ValidateSnapshotTests(unittest.TestCase):
    def setUp(self):
        self.validator = load_script("validate_snapshot")

    def test_valid_document_passes(self):
        content = (
            "# מודול API\n\nTopic ID: `56`\n\n"
            "## Post 0 — author — topic author\n\n"
            "Source: https://f2.freeivr.co.il/post/700\n\n`type=api`\n"
        )
        self.assertEqual(self.validator.validate_document("topic.md", content, 10000), [])

    def test_document_without_https_post_source_fails(self):
        errors = self.validator.validate_document(
            "topic.md", "# T\n\nTopic ID: `1`\n\n## Post 0\n\nSource: http://example.com/post/1\n", 10000
        )
        self.assertTrue(any("https" in error.lower() for error in errors))

    def test_duplicate_document_paths_fail(self):
        documents = [
            ("one.md", "Source: https://f2.freeivr.co.il/post/1"),
            ("one.md", "Source: https://f2.freeivr.co.il/post/2"),
        ]
        errors = self.validator.validate_unique_paths(documents)
        self.assertTrue(any("duplicate" in error.lower() for error in errors))

    def test_topic_count_keeps_same_numeric_id_from_different_sources(self):
        documents = [
            ("f2.md", "Source kind: `f2`\nTopic ID: `97`"),
            ("api.md", "Source kind: `api-forum`\nTopic ID: `97`"),
        ]
        self.assertEqual(len(self.validator.collect_topic_keys(documents)), 2)


if __name__ == "__main__":
    unittest.main()
