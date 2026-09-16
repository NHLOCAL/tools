"""Shared, escaped HTML components for every catalog page."""

from html import escape
from urllib.parse import quote

from .catalog import CATEGORIES, ROOT, parse_tool

REPO_URL = "https://github.com/NHLOCAL/tools"
SITE_URL = "https://" + (ROOT / "CNAME").read_text(encoding="utf-8").strip()

ICON_PATHS = {
    "arrow": '<path d="M19 12H5m6-6-6 6 6 6"/>',
    "external": '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
    "download": '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    "monitor": '<rect x="3" y="3" width="18" height="13" rx="1"/><path d="M8 21h8m-4-5v5"/>',
    "code": '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
    "zap": '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
    "package": '<path d="m12 2 10 5v10l-10 5-10-5V7l10-5zm0 10 10-5M2 7l10 5v10M7 4.5l10 5V15"/>',
    "folder": '<path d="M3 20V4h7l3 3h8v13z"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "search": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    "moon": '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    "menu": '<path d="M3 6h18M3 12h18M3 18h18"/>',
    "close": '<path d="m5 5 14 14M5 19 19 5"/>',
    "check": '<path d="m4 12 5 5L20 6"/>',
    "terminal": '<path d="m4 5 7 7-7 7m9 0h7"/>',
    "book": '<path d="M12 5v17M3 3h5l4 2 4-2h5v16h-5l-4 2-4-2H3z"/>',
}


def icon(name):
    return (f'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter" '
            f'aria-hidden="true">{ICON_PATHS[name]}</svg>')


def local(path, prefix=""):
    return escape(prefix + quote(path, safe="/#"), quote=True)


def actions(tool, prefix=""):
    links = []
    if tool.category == "web":
        links.append(f'<a class="button primary" href="{local(tool.path, prefix)}">{icon("arrow")}פתיחת הכלי</a>')
    if not tool.is_directory:
        payload = local(f"assets/downloads/{tool.id}.js", prefix)
        links.append(f'<a class="button download" href="{local(tool.path, prefix)}" download="{escape(tool.filename)}" data-download-id="{escape(tool.id)}" data-download-payload="{payload}">{icon("download")}הורד קובץ</a>')
    elif tool.category in {"skill", "extension"}:
        # Extensions are published on a dedicated release, not the latest skill release.
        release = "download/extensions" if tool.category == "extension" else "latest/download"
        url = f"{REPO_URL}/releases/{release}/{quote(tool.id)}.zip"
        links.append(f'<a class="button primary download" href="{url}">{icon("download")}הורד ZIP</a>')
    source_kind = "tree" if tool.is_directory else "blob"
    links.append(f'<a class="text-action" href="{REPO_URL}/{source_kind}/main/{quote(tool.path)}">{icon("code")}קוד מקור</a>')
    if tool.has_resources:
        links.append(f'<a class="text-action" href="{REPO_URL}/tree/main/resources/{quote(tool.id)}">{icon("folder")}משאבים</a>')
    return "".join(links)


def tool_card(tool, prefix=""):
    title_id = escape(tool.id + "-title")
    search = escape(f"{tool.name} {tool.description} {tool.id} {tool.path}")
    category = next(c for c in CATEGORIES if c.key == tool.category)
    formats = {"web": "HTML", "script": "BAT", "extension": "CHROME / ZIP", "skill": "AI / ZIP"}
    return f'''<article class="tool-item {tool.category}" id="{escape(tool.id)}" data-search="{search}" aria-labelledby="{title_id}">
      <div class="tool-heading"><span class="tool-symbol">{icon(category.icon)}</span>
        <span class="file-type" dir="ltr">{formats[tool.category]}</span>
        <a class="icon-button share-link" href="#{quote(tool.id)}" aria-label="העתקת קישור אל {escape(tool.name)}" title="העתקת קישור">{icon("link")}</a></div>
      <div class="tool-info"><h3 id="{title_id}">{escape(tool.name)}</h3><p>{escape(tool.description)}</p></div>
      <div class="tool-actions">{actions(tool, prefix)}</div>
    </article>'''


def generate_tool_html(line, tool_type):
    """Compatibility entry point for the existing release validation."""
    return tool_card(parse_tool(line, tool_type))


def category_nav(tools, prefix="", active=None):
    total = len(tools)
    current = ' aria-current="page"' if active is None else ""
    links = [f'<a href="{prefix}index.html#catalog"{current}>{icon("folder")}<span>כל הכלים</span><span class="count">{total:02d}</span></a>']
    for category in CATEGORIES:
        current = ' aria-current="page"' if active == category.key else ""
        count = sum(t.category == category.key for t in tools)
        links.append(f'<a href="{local(category.page, prefix)}"{current}>{icon(category.icon)}<span>{category.title}</span><span class="count">{count:02d}</span></a>')
    return '<nav class="category-nav" aria-label="קטגוריות הכלים">' + "".join(links) + '</nav>'


def catalog_content(tools, prefix="", active=None):
    selected = [c for c in CATEGORIES if active is None or c.key == active]
    search_label = f"חיפוש בקטגוריית {selected[0].title}" if active else "חיפוש בארגז הכלים"
    placeholder = f"חיפוש בקטגוריית {selected[0].title}" if active else "איזה כלי מחפשים?"
    empty_title = "לא נמצאו כלים בקטגוריה הזו" if active else "לא נמצאו כלים"
    reset_label = "הצגת כל הכלים בקטגוריה" if active else "הצגת כל הכלים"
    global_link = f'<a class="text-action" href="{prefix}index.html#catalog">חיפוש בכל ארגז הכלים{icon("arrow")}</a>' if active else ""
    sections = []
    for category in selected:
        items = [t for t in tools if t.category == category.key]
        more = (f'<a class="section-link" href="{local(category.page, prefix)}">לכל {category.title}{icon("arrow")}</a>' if active is None else "")
        sections.append(f'''<section class="tool-section" aria-labelledby="{category.key}-heading" data-category="{category.key}">
          <header class="section-heading"><div><h2 id="{category.key}-heading">{category.title}<span class="count">{len(items):02d}</span></h2>
          <p>{category.description}</p></div>{more}</header>
          <div class="tool-list">{"".join(tool_card(t, prefix) for t in items)}</div></section>''')
    count = sum(1 for t in tools if active is None or t.category == active)
    return f'''<section class="catalog-layout" id="catalog" aria-label="קטלוג הכלים">
      <aside class="catalog-sidebar"><h2>מה בארגז?</h2>{category_nav(tools, prefix, active)}
        <a class="sidebar-help" href="{prefix}downloads.html">{icon("book")}איך משתמשים ומורידים?{icon("arrow")}</a>
        <p class="sidebar-note">קוד פתוח. רעיונות פתוחים.<br>אפשר להשתמש, לשנות ולשפר.</p></aside>
      <div class="catalog-main"><form class="search-form" role="search" action="#catalog">
        <label for="tool-search">{search_label}</label><div class="search-field">{icon("search")}
        <input id="tool-search" type="search" name="q" autocomplete="off" placeholder="{placeholder}" aria-controls="catalog-results" aria-describedby="search-count">
        <kbd aria-hidden="true">/</kbd></div><noscript><p>החיפוש דורש JavaScript. כל הכלים מופיעים בהמשך ואפשר לעבור ביניהם דרך הקטגוריות.</p></noscript></form>
        <div class="results-line"><p id="search-count" role="status" aria-live="polite">{count} כלים לבחירה</p><button class="text-action" id="clear-search" type="button" hidden>ניקוי החיפוש{icon("close")}</button></div>
        <div id="catalog-results">{"".join(sections)}</div>
        <div class="empty-state" id="empty-state" hidden><span class="empty-symbol">{icon("search")}</span><h2>{empty_title}</h2><p>נסו שם אחר או תיאור של הפעולה.</p><button class="button primary" type="button" data-reset-search>{reset_label}{icon("arrow")}</button>{global_link}</div>
      </div></section>'''


def hero(tools):
    drawers = []
    for category in CATEGORIES:
        count = sum(tool.category == category.key for tool in tools)
        drawers.append(f'<a class="drawer {category.key}" href="{category.page}">{icon(category.icon)}<strong>{category.title}</strong><span>{count:02d}</span>{icon("arrow")}</a>')
    return f'''<section class="hero" aria-labelledby="hero-title"><div class="hero-copy">
      <h1 id="hero-title">כלים קטנים.<br><span>אפשרויות גדולות.</span></h1>
      <p>ארגז הכלים של <bdi>NH Local</bdi>. אוסף כלים שימושיים וקלי משקל, שנוצרו כדי לפתור בעיות קטנות במהירות.</p>
      <div class="hero-actions"><a class="button primary" href="#catalog">פותחים את הארגז{icon("arrow")}</a><a class="text-action" href="downloads.html">כל מה שצריך להורדה{icon("download")}</a></div>
      <p class="hero-note"><span class="status-dot" aria-hidden="true"></span>לשימוש חופשי · בקוד פתוח · גם להורדה</p></div>
      <div class="toolbox" aria-label="גישה מהירה לקטגוריות"><div class="window-title"><span dir="ltr">NH_LOCAL / TOOLBOX</span><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
      <div class="toolbox-screen"><div class="terminal-line" dir="ltr"><span>&gt;</span> find your next tool<span class="cursor" aria-hidden="true">_</span></div>
      <div class="drawers">{"".join(drawers)}</div><div class="terminal-footer"><span dir="ltr">{len(tools)} tools · 4 directories</span><span dir="ltr">READY{icon("check")}</span></div></div></div></section>'''


def page_intro(title, description, prefix="", extra=""):
    return f'''<section class="page-intro"><nav class="breadcrumbs" aria-label="מיקום באתר"><a href="{prefix}index.html">ארגז הכלים</a>{icon("arrow")}<span aria-current="page">{escape(title)}</span></nav>
    <h1>{escape(title)}</h1><p>{escape(description)}</p>{extra}</section>'''
