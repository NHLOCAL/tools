"""Page composition, metadata and deterministic output generation."""

import json
import re
from html import escape
from pathlib import Path

from markdown2 import Markdown

from .catalog import CATEGORIES, ROOT, read_catalog
from .render import SITE_URL, REPO_URL, catalog_content, hero, icon, page_intro

SITE_NAME = "ארגז הכלים של NH Local"
HOME_DESCRIPTION = "כלי דפדפן, סקילים לעוזרי AI, סקריפטים ותוספי כרום של NH Local. מצאו כלי לפי קטגוריה, פתחו אותו בדפדפן או הורידו למחשב, עם גישה לקוד המקור."


def metadata(title, description, path, tools=(), breadcrumbs=()):
    url = SITE_URL + "/" + path
    graph = [{"@type": "WebSite", "@id": SITE_URL + "/#website", "url": SITE_URL + "/", "name": SITE_NAME, "inLanguage": "he"},
             {"@type": "CollectionPage" if tools else "WebPage", "@id": url, "url": url, "name": title, "description": description,
              "inLanguage": "he", "isPartOf": {"@id": SITE_URL + "/#website"}}]
    if tools:
        graph[1]["mainEntity"] = {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": index, "name": tool.name, "url": url + "#" + tool.id}
            for index, tool in enumerate(tools, 1)]}
    if breadcrumbs:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": index, "name": name, "item": SITE_URL + "/" + item}
            for index, (name, item) in enumerate(breadcrumbs, 1)]})
    structured = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c")
    return f'''<title>{escape(title)}</title>
    <meta name="description" content="{escape(description)}">
    <link rel="canonical" href="{escape(url)}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="he_IL">
    <meta property="og:site_name" content="{SITE_NAME}">
    <meta property="og:title" content="{escape(title)}">
    <meta property="og:description" content="{escape(description)}">
    <meta property="og:url" content="{escape(url)}">
    <meta property="og:image" content="{SITE_URL}/assets/social-card.png">
    <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="ארגז הכלים של NH Local: סקילים, כלי דפדפן, סקריפטים ותוספי כרום">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">{structured}</script>'''


def render_page(template, content, meta, prefix="", active="catalog", page="home"):
    nav = []
    for key, title, path in (("catalog", "הכלים", "index.html#catalog"), ("downloads", "מדריך הורדה", "downloads.html"), ("about", "על הפרויקט", "about.html")):
        current = ' aria-current="page"' if key == active else ""
        nav.append(f'<a href="{prefix}{path}"{current}>{title}</a>')
    replacements = {"META": meta, "CONTENT": content, "PREFIX": prefix, "NAV": "".join(nav), "PAGE": page,
                    "REPO_URL": REPO_URL, "TERMINAL_ICON": icon("terminal"), "MENU_ICON": icon("menu"),
                    "MOON_ICON": icon("moon"), "SUN_ICON": icon("sun"), "CLOSE_ICON": icon("close"),
                    "ARROW_ICON": icon("arrow"), "CODE_ICON": icon("code")}
    for key, value in replacements.items():
        template = template.replace("{{ " + key + " }}", value)
    if "{{ " in template:
        raise ValueError("Unresolved template placeholder")
    return template


def download_guide():
    sections = [
        ("monitor", "כלי דפדפן", "לחצו על פתיחת הכלי לשימוש באתר, או על הורד קובץ לשמירת HTML במחשב. את הקובץ פותחים בדפדפן. חלק מהכלים דורשים אינטרנט; מחולל הפודקאסטים דורש גם מפתח Gemini API.", "catalog/web.html"),
        ("zap", "סקילים", "הורידו ZIP, חלצו את התיקייה והתקינו אותה בעוזר ה-AI שלכם. הוראות השימוש נמצאות בקובץ SKILL.md.", "catalog/skill.html"),
        ("code", "סקריפטים", "הורידו את קובץ ה-BAT, קראו את ההוראות שבתוכו והפעילו ב-Windows. הדפדפן עשוי לבקש אישור לשמירת הקובץ.", "catalog/script.html"),
        ("package", "תוספי כרום", "הורידו ZIP וחלצו אותו. בניהול התוספים של Chrome הפעילו מצב מפתח, לחצו על טעינת תוסף לא ארוז ובחרו את התיקייה שמכילה manifest.json.", "catalog/extension.html"),
    ]
    content = page_intro("מדריך שימוש והורדה", "הוראות פתיחה והתקנה לפי סוג הכלי.")
    content += '<div class="guide-layout">'
    for symbol, title, description, path in sections:
        content += f'<section class="guide-section"><span class="guide-icon">{icon(symbol)}</span><div><h2>{title}</h2><p>{description}</p><a class="text-action" href="{path}">לבחירת {title}{icon("arrow")}</a></div></section>'
    content += '''</div><section class="help-strip"><h2>ההורדה לא התחילה?</h2><p>בדקו את רשימת ההורדות ואת הרשאות הדפדפן. אם הורדת ZIP נחסמה בסינון הרשת, נסו לגשת לקבצים דרך קוד מקור.</p></section>'''
    return content


def about_page():
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    match = re.search(r"^## על הפרויקט\s*\n(.*?)(?=^## |\Z)", readme, re.M | re.S)
    original = Markdown().convert(match.group(1) if match else "")
    return page_intro("כלים קטנים, קוד פתוח", "ארגז הכלים של NH Local נולד כדי לפתור בעיות קטנות במהירות.") + f'''
      <div class="about-layout"><section class="prose"><h2>על הפרויקט</h2>{original}
      <h2>ארגז אחד, כמה דרכי עבודה</h2><p>כלי הדפדפן נפתחים ישירות מהאתר. לצידם תמצאו סקריפטים למחשב, תוספי כרום וסקילים לעוזרי AI. לכל כלי מצורפים קישורים להורדה ולקוד המקור, ולחלקם גם קובצי משאבים.</p>
      <h2>משתמשים, משנים ומשתפים</h2><p>הקוד זמין תחת <a href="{REPO_URL}/blob/main/LICENSE">רישיון MIT</a>. אפשר להתאים את הכלים לצרכים שלכם ולשתף שיפורים דרך מאגר הפרויקט.</p>
      <a class="button primary" href="{REPO_URL}">למאגר ב-GitHub{icon("external")}</a></section>
      <aside class="about-note"><span class="pixel-mark" aria-hidden="true">{icon("terminal")}</span><h2>נבנה כדי להיות שימושי.<br>פתוח כדי להשתפר.</h2><p>מצאתם תקלה או יש לכם רעיון לשיפור?</p><a class="text-action" href="{REPO_URL}/issues">פתיחת פנייה ב-GitHub{icon("arrow")}</a></aside></div>'''


def build_site():
    tools = read_catalog()
    template = (ROOT / "template.html").read_text(encoding="utf-8")
    pages = {"index.html": render_page(template, hero(tools) + catalog_content(tools), metadata(SITE_NAME + " | כלים שימושיים להורדה ולדפדפן", HOME_DESCRIPTION, "", tools))}
    for category in CATEGORIES:
        selected = [tool for tool in tools if tool.category == category.key]
        content = page_intro(category.title, category.description, "../") + catalog_content(tools, "../", category.key)
        meta = metadata(category.title + " | " + SITE_NAME, category.description + ". " + " · ".join(t.name for t in selected), category.page, selected,
                        ((SITE_NAME, ""), (category.title, category.page)))
        pages[category.page] = render_page(template, content, meta, "../", page="category")
    for path, content, title, description, active in (
        ("downloads.html", download_guide(), "מדריך שימוש והורדה", "איך פותחים ומורידים כלי HTML, מפעילים סקריפטים ב-Windows ומתקינים תוספי כרום וסקילים לעוזרי AI מארגז הכלים של NH Local.", "downloads"),
        ("about.html", about_page(), "על הפרויקט", "הכירו את ארגז הכלים של NH Local: אוסף כלים שימושיים בקוד פתוח, לשימוש, להורדה ולשיפור משותף תחת רישיון MIT.", "about"),
    ):
        pages[path] = render_page(template, content, metadata(title + " | " + SITE_NAME, description, path, breadcrumbs=((SITE_NAME, ""), (title, path))), active=active, page=active)
    content = page_intro("הדף הזה לא נמצא בארגז", "ייתכן שהקישור השתנה או שהכתובת אינה מלאה.", "/") + '<p class="not-found"><a class="button primary" href="/">חזרה לכל הכלים' + icon("arrow") + '</a></p>'
    pages["404.html"] = render_page(template, content, '<title>הדף לא נמצא | ארגז הכלים</title><meta name="robots" content="noindex">', "/", page="not-found")
    for path, html in pages.items():
        output = ROOT / path
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(html, encoding="utf-8", newline="\n")
    return tools, pages
