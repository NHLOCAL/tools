"""Public routes, download contracts and generated SEO regression checks."""

import json
import base64
import re
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from build import main
from site_builder.catalog import CATEGORIES, Tool, read_catalog
from site_builder.render import SITE_URL, tool_card


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def attrs(self, tag):
        return [attrs for name, attrs in self.tags if name == tag]


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main()
        cls.tools = read_catalog()
        cls.paths = ["index.html", "downloads.html", "about.html", "404.html"] + [c.page for c in CATEGORIES]
        cls.sources = {path: (ROOT / path).read_text(encoding="utf-8") for path in cls.paths}

    def test_all_routes_have_semantic_landmarks_and_unique_ids(self):
        for path, source in self.sources.items():
            with self.subTest(path=path):
                doc = Document(source)
                for tag in ("main", "h1"):
                    self.assertEqual(len(doc.attrs(tag)), 1)
                self.assertEqual(doc.attrs("html")[0], {"lang": "he", "dir": "rtl"})
                ids = [attrs["id"] for _, attrs in doc.tags if "id" in attrs]
                self.assertEqual(len(ids), len(set(ids)))
                self.assertNotIn("{{ ", source)
                self.assertNotIn('onclick=', source)

    def test_local_navigation_assets_and_fragments_resolve(self):
        for path, source in self.sources.items():
            for tag, attrs in Document(source).tags:
                url = attrs.get("href") or attrs.get("src")
                if not url or urlsplit(url).scheme or url.startswith("//"):
                    continue
                parsed = urlsplit(url)
                if parsed.path.startswith("/"):
                    target = ROOT / unquote(parsed.path).lstrip("/")
                else:
                    target = (ROOT / path).parent / unquote(parsed.path) if parsed.path else ROOT / path
                if target.is_dir():
                    target /= "index.html"
                with self.subTest(page=path, link=url):
                    self.assertTrue(target.exists(), target)
                    if parsed.fragment and target.suffix == ".html":
                        ids = [a.get("id") for _, a in Document(target.read_text(encoding="utf-8")).tags]
                        self.assertIn(unquote(parsed.fragment), ids)

    def test_every_original_tool_anchor_remains_on_homepage(self):
        ids = [attrs.get("id") for _, attrs in Document(self.sources["index.html"]).tags]
        for tool in self.tools:
            self.assertIn(tool.id, ids)

    def test_category_pages_include_only_their_tools(self):
        for category in CATEGORIES:
            doc = Document(self.sources[category.page])
            ids = [attrs["id"] for attrs in doc.attrs("article")]
            self.assertEqual(ids, [tool.id for tool in self.tools if tool.category == category.key])

    def test_downloads_are_native_same_origin_and_keep_exact_filenames(self):
        doc = Document(self.sources["index.html"])
        downloads = [a for a in doc.attrs("a") if "download" in a]
        files = [t for t in self.tools if not t.is_directory]
        self.assertEqual(len(downloads), len(files))
        for tool in files:
            link = next(a for a in downloads if a["download"] == tool.filename)
            self.assertEqual(unquote(link["href"]), tool.path)
            self.assertFalse(urlsplit(link["href"]).scheme)

    def test_zip_releases_are_scoped_to_the_correct_product(self):
        source = self.sources["index.html"]
        self.assertIn("releases/download/extensions/nodebb-thread-exporter.zip", source)
        self.assertIn("releases/latest/download/yemot-telephony.zip", source)
        self.assertNotIn("latest/download/nodebb-thread-exporter", source)

    def test_local_download_payloads_preserve_original_file_bytes(self):
        for tool in self.tools:
            if tool.is_directory:
                continue
            payload = (ROOT / "assets" / "downloads" / f"{tool.id}.js").read_text(encoding="utf-8")
            encoded = re.search(r'\] = "([A-Za-z0-9+/=]+)";', payload).group(1)
            self.assertEqual(base64.b64decode(encoded), (ROOT / tool.path).read_bytes())

    def test_indexable_pages_have_unique_metadata_and_parseable_structured_data(self):
        titles, descriptions, canonicals = [], [], []
        paths = [p for p in self.paths if p != "404.html"] + [t.path for t in self.tools if t.category == "web"]
        for path in paths:
            source = (ROOT / path).read_text(encoding="utf-8")
            doc = Document(source)
            with self.subTest(path=path):
                self.assertEqual(len(doc.attrs("title")), 1)
                titles.append(re.search(r"<title>(.*?)</title>", source).group(1))
                desc = [a["content"] for a in doc.attrs("meta") if a.get("name") == "description"]
                self.assertEqual(len(desc), 1)
                descriptions.extend(desc)
                canonical = [a["href"] for a in doc.attrs("link") if a.get("rel") == "canonical"]
                self.assertEqual(canonical, [SITE_URL + "/" + ("" if path == "index.html" else path)])
                canonicals.extend(canonical)
                blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
                self.assertEqual(len(blocks), 1)
                graph = json.loads(blocks[0])
                self.assertEqual(graph["@context"], "https://schema.org")
        for values in (titles, descriptions, canonicals):
            self.assertEqual(len(values), len(set(values)))

    def test_sitemap_contains_canonical_pages_only(self):
        doc = ElementTree.parse(ROOT / "sitemap.xml")
        urls = [node.text for node in doc.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        expected = {SITE_URL + "/" + ("" if path == "index.html" else path) for path in self.paths if path != "404.html"}
        expected.update(SITE_URL + "/" + t.path for t in self.tools if t.category == "web")
        self.assertEqual(set(urls), expected)
        self.assertEqual(len(urls), len(expected))
        self.assertIn("Sitemap: " + SITE_URL + "/sitemap.xml", (ROOT / "robots.txt").read_text())
        self.assertIn('content="noindex"', self.sources["404.html"])

    def test_catalog_text_is_escaped(self):
        tool = Tool('<script>alert("x")</script>', 'tools/html_editor.html', '<img onerror="bad"> & text', 'web', 'safe', False, False)
        rendered = tool_card(tool)
        self.assertNotIn('<script>', rendered)
        self.assertNotIn('<img ', rendered)
        self.assertIn('&lt;script&gt;', rendered)

    def test_rebuilding_is_byte_identical_including_standalone_tools(self):
        paths = self.paths + [t.path for t in self.tools if t.category == "web"] + ["robots.txt", "sitemap.xml"]
        before = {path: (ROOT / path).read_bytes() for path in paths}
        main()
        self.assertEqual(before, {path: (ROOT / path).read_bytes() for path in paths})


if __name__ == "__main__":
    unittest.main()
