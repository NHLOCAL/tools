# Static website maintenance

The public website is generated from README.md. Its existing browser tools keep their original URLs and can still run as independent HTML files. GitHub Pages serves the committed files; no JavaScript framework or server is required.

## Build and check

```powershell
python -m pip install -r requirements.txt
python build.py
python -m unittest discover -s tests -v
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. Opening index.html directly also works, including downloads with JavaScript enabled. Without JavaScript, catalog content and navigation remain available; when opening local files, use the browser's Save As command if a download link opens the file.

Run the build after editing README.md, templates, or a browser tool. Commit the generated output with its source change. The site checks workflow verifies metadata, routes, anchors, downloadable bytes, archive destinations, and reproducible output.

## Source boundaries

| Source | Owns |
| --- | --- |
| README.md | Tool names, paths, descriptions, and project text |
| site_builder/catalog.py | Catalog parsing, validation, categories, and public anchors |
| site_builder/render.py | Shared catalog components and download destinations |
| site_builder/pages.py | Page composition, copy, and shared metadata |
| site_builder/seo.py | Sitemap, robots file, and marked metadata blocks in tool heads |
| site_builder/downloads.py | Lazy payloads for downloading from file:// |
| template.html | Shared HTML shell, navigation, dialogs and landmarks |
| assets/site.css | Design tokens, responsive layout, states and terminal motion |
| assets/theme.js | Theme selection before paint |
| assets/site.js | Search, sharing, navigation and downloads |
| assets/space-grid.js | Interactive grid and Easter eggs |

Generated files: index.html, catalog/*.html, about.html, downloads.html, 404.html, robots.txt, sitemap.xml, and assets/downloads/*.js. The builder replaces the marked metadata block, title and description in a tool's head, leaving the body and its behavior intact. Descriptions from standalone builds are replaced to prevent duplicate metadata.

## Download contract

- HTML and BAT files retain their names and exact bytes. HTTP pages fetch the original file and save an application/octet-stream Blob.
- Local file pages cannot fetch sibling files. They load a generated download payload only after a click, decode its bytes, and save the same Blob. These payloads add no initial page transfer.
- Failed downloads show a visible error with retry/source guidance. Failed clipboard access offers a selectable direct URL.
- Chrome extension ZIPs use the `extensions` release. The Yemot skill uses the latest release asset. Keep their destinations separate.
- BAT files use CRLF in the working tree on all platforms so their download payloads remain reproducible.

## Accessibility and motion

Keyboard navigation, visible focus, a skip link, RTL, live search results, and reduced motion are supported. The grid draws once at rest, redraws during input, and stops on completion or tab hiding. Background dragging temporarily disables selection and hover targets; starting a selection on text remains native. Touch scrolling is not intercepted.

Easter eggs: press the physical G key twice within 1.2 seconds outside editable fields, click the terminal title three times to show a pixel cat, or search for 42. A small footer disclosure explains them and offers a cat button that also requires three clicks. Each cat trigger counts independently without a timing limit. Escape dismisses effects; reduced motion keeps the messages while suppressing animation.

## SEO

Every public catalog page and browser tool has unique metadata and a canonical URL under CNAME. Collection pages expose their actual tool list as JSON-LD; secondary catalog pages have breadcrumbs. The sitemap includes only public canonical pages. Source, resource, and work-in-progress paths are excluded from crawling. The 404 page has noindex.

The URL and breadcrumb implementation follows [Google's URL guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) and [breadcrumb documentation](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb). This does not measure search rankings or indexing. No analytics or external tracking was added.
