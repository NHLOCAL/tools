"""Canonical metadata and crawler entry points, generated from the same catalog."""

import re
from html import escape
from urllib.parse import quote

from .catalog import ROOT
from .pages import SITE_NAME, metadata
from .render import SITE_URL

START = "<!-- catalog metadata:start -->"
END = "<!-- catalog metadata:end -->"


def write_seo(tools, pages):
    paths = ["" if path == "index.html" else path for path in pages if path != "404.html"]
    for tool in tools:
        if tool.category != "web":
            continue
        path = ROOT / tool.path
        html = path.read_text(encoding="utf-8")
        head, separator, body = html.partition("</head>")
        if not separator:
            raise ValueError(f"Missing head element in {tool.path}")
        # Replace catalog-owned metadata, including descriptions from standalone builds.
        head = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n?", "", head, flags=re.S)
        head = re.sub(r"[ \t]*<title>.*?</title>[ \t]*\n?", "", head, count=1, flags=re.S)
        head = re.sub(r'''[ \t]*<meta\b(?=[^>]*\bname\s*=\s*(['"])description\1)[^>]*>[ \t]*\n?''', "", head, flags=re.I)
        block = metadata(tool.name + " | " + SITE_NAME, tool.description, tool.path)
        html = head + f"{START}\n{block}\n{END}\n" + separator + body
        path.write_text(html, encoding="utf-8", newline="\n")
        paths.append(tool.path)
    urls = "\n".join(f"  <url><loc>{escape(SITE_URL + '/' + quote(path, safe='/'))}</loc></url>" for path in paths)
    sitemap = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8", newline="\n")
    robots = ("User-agent: *\nAllow: /\nDisallow: /resources/\nDisallow: /wip/\n"
              "Disallow: /template.html\nDisallow: /docs/\nDisallow: /tests/\nDisallow: /site_builder/\n"
              f"\nSitemap: {SITE_URL}/sitemap.xml\n")
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8", newline="\n")
