import sys
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from site_builder.catalog import CATEGORIES, parse_tool, read_catalog


class CatalogTests(unittest.TestCase):
    def test_all_readme_tools_have_existing_paths_and_stable_anchors(self):
        tools = read_catalog()
        self.assertEqual(len(tools), 9)
        self.assertEqual({tool.category for tool in tools}, {c.key for c in CATEGORIES})
        self.assertEqual(tools[0].id, "yemot-telephony")
        subtitle = next(tool for tool in tools if tool.id == "subtitle_editor")
        self.assertEqual(subtitle.path, "tools/subtitle_editor.html")
        self.assertTrue(subtitle.has_resources)
        self.assertTrue(any(tool.id == "משדרג-הקישורים-1.0" for tool in tools))

    def test_missing_and_external_paths_fail_the_build(self):
        for path in ("missing.html", "../../outside.html", "https://example.com/tool"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                parse_tool(f"- [כלי]({path}) - תיאור", "web")

    def test_duplicate_anchors_fail_instead_of_breaking_deep_links(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "sample.html").write_text("test")
            (root / "README.md").write_text(
                "## כלי דפדפן\n- [א](sample.html) - א\n- [ב](sample.html) - ב", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                read_catalog(root)


if __name__ == "__main__":
    unittest.main()
