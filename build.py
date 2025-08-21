# build.py
import re
import os
from markdown2 import Markdown

# --- הגדרות ---
README_FILE = 'README.md'
TEMPLATE_FILE = 'template.html'
OUTPUT_FILE = 'index.html'
GITHUB_USERNAME = 'nhlocal'
GITHUB_REPO_NAME = 'tools'

# ביטוי רגולרי למציאת פריטי רשימה בפורמט: - [Name](path) - Description
TOOL_PATTERN = re.compile(r"^-\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)$")

# --- תבניות HTML ---

WEB_TOOL_ITEM_TEMPLATE = """
<div class="tool-item" id="{tool_id}">
    <div class="tool-main-content">
        <a href="#{tool_id}" class="link-icon" onclick="copyDirectLink(this, event)" title="העתק קישור ישיר">
            <i data-feather="link"></i>
        </a>
        <div class="tool-info">
            <h3>{name}</h3>
            <p>{description}</p>
        </div>
    </div>
    <div class="tool-actions">
        <a href="{path}"><i data-feather="play-circle"></i> הפעל</a>
        <a href="https://raw.githubusercontent.com/{user}/{repo}/main/{path}" 
           onclick="event.preventDefault(); forceDownload(this.href, '{filename}');"><i data-feather="download"></i> הורד</a>
{resources_button}
    </div>
</div>
"""

DOWNLOADABLE_TOOL_ITEM_TEMPLATE = """
<div class="tool-item" id="{tool_id}">
    <div class="tool-main-content">
        <a href="#{tool_id}" class="link-icon" onclick="copyDirectLink(this, event)" title="העתק קישור ישיר">
            <i data-feather="link"></i>
        </a>
        <div class="tool-info">
            <h3>{name}</h3>
            <p>{description}</p>
        </div>
    </div>
    <div class="tool-actions">
{action_buttons}
    </div>
</div>
"""

RESOURCES_BUTTON_TEMPLATE = '        <a href="https://github.com/{user}/{repo}/tree/main/resources/{tool_name}"><i data-feather="folder"></i> משאבים</a>'
SOURCE_BUTTON_TEMPLATE = '        <a href="https://github.com/{user}/{repo}/tree/main/{path}"><i data-feather="github"></i> קוד מקור</a>'
DOWNLOAD_BUTTON_TEMPLATE = '        <a href="https://raw.githubusercontent.com/{user}/{repo}/main/{path}" onclick="event.preventDefault(); forceDownload(this.href, \'{filename}\');"><i data-feather="download"></i> הורד</a>'
DOWNLOAD_RELEASE_BUTTON_TEMPLATE = '        <a href="https://github.com/{user}/{repo}/releases/latest/download/{zip_name}"><i data-feather="archive"></i> הורד ZIP</a>'


def generate_tool_html(line, tool_type):
    """מקבל שורה וסוג כלי, ומייצר את ה-HTML המתאים."""
    match = TOOL_PATTERN.match(line.strip())
    if not match:
        return ""

    name, path, description = [s.strip() for s in match.groups()]
    is_directory = path.endswith('/') or os.path.isdir(path)
    
    filename = path.strip('/').split('/')[-1] if is_directory else path.split('/')[-1]
    tool_id = filename.rsplit('.', 1)[0] if '.' in filename and not is_directory else filename
    
    resources_button_html = ""
    resources_path = os.path.join('resources', tool_id)
    if os.path.isdir(resources_path):
        resources_button_html = RESOURCES_BUTTON_TEMPLATE.format(
            user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, tool_name=tool_id
        )

    if tool_type == 'web':
        return WEB_TOOL_ITEM_TEMPLATE.format(
            name=name, description=description, path=path, filename=filename,
            user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, tool_id=tool_id,
            resources_button=resources_button_html
        )
    
    action_buttons = []
    if tool_type == 'extension':
        action_buttons.append(DOWNLOAD_RELEASE_BUTTON_TEMPLATE.format(
            user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, zip_name=f"{tool_id}.zip"
        ))
        action_buttons.append(SOURCE_BUTTON_TEMPLATE.format(
            user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, path=path
        ))
    else: # For python and other types
        if not is_directory:
            action_buttons.append(DOWNLOAD_BUTTON_TEMPLATE.format(
                user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, path=path, filename=filename
            ))
        action_buttons.append(SOURCE_BUTTON_TEMPLATE.format(
            user=GITHUB_USERNAME, repo=GITHUB_REPO_NAME, path=path
        ))
    
    if resources_button_html:
        action_buttons.append(resources_button_html)

    return DOWNLOADABLE_TOOL_ITEM_TEMPLATE.format(
        name=name, description=description, action_buttons="\n".join(action_buttons), tool_id=tool_id
    )


def main():
    """הפונקציה הראשית שבונה את האתר."""
    print(f"Reading content from {README_FILE}...")
    try:
        with open(README_FILE, 'r', encoding='utf-8') as f:
            readme_content = f.read()
    except FileNotFoundError:
        print(f"Error: The file {README_FILE} was not found.")
        return

    # פיצול לפי כותרות ## או ### כדי לטפל בכל סוגי התוכן
    sections = re.split(r'^\s*(##|###)\s*(.*?)\s*$', readme_content, flags=re.MULTILINE)
    
    intro_content = sections[0].strip()
    markdown_converter = Markdown(extras=["fenced-code-blocks", "tables", "cuddled-lists"])
    final_content_html = markdown_converter.convert(intro_content)
    final_content_html = re.sub(r'<h1>(.*?)</h1>', r'<h1><img src="favicon.png" alt="" class="favicon-title" aria-hidden="true" /> \1</h1>', final_content_html, 1)

    # מעבר על כל חלקי התוכן
    # sections יכיל: [..., heading_level, title, content, ...]
    for i in range(1, len(sections), 3):
        heading_level = sections[i]
        title = sections[i+1]
        content = sections[i+2].strip()
        
        # --- השינוי המרכזי: בדיקה האם הקטע מכיל כלים ---
        tool_lines = [line for line in content.split('\n') if TOOL_PATTERN.match(line.strip())]
        
        if tool_lines:  # אם זהו קטע כלים
            title_lower = title.lower()
            if 'דפדפן' in title_lower:
                tool_type, icon = 'web', 'monitor'
            elif 'scripts' in title_lower or 'סקריפטים' in title_lower:
                tool_type, icon = 'script', 'code'
            elif 'extension' in title_lower or 'תוספי' in title_lower:
                tool_type, icon = 'extension', 'package'
            else:
                tool_type, icon = 'other', 'tool'

            final_content_html += f"\n<h2><i data-feather='{icon}'></i> {title}</h2>\n"
            
            for line in tool_lines:
                final_content_html += generate_tool_html(line, tool_type)
        
        else:  # אם זהו קטע תוכן רגיל (כמו "על הפרויקט")
            full_markdown_section = f"{heading_level} {title}\n{content}"
            final_content_html += '\n' + markdown_converter.convert(full_markdown_section)

    print(f"Reading template from {TEMPLATE_FILE}...")
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template = f.read()
    
    final_html = template.replace('{{ CONTENT }}', final_content_html)
    final_html = final_html.replace('{{ GITHUB_USERNAME }}', GITHUB_USERNAME)
    final_html = final_html.replace('{{ GITHUB_REPO_NAME }}', GITHUB_REPO_NAME)

    print(f"Writing final output to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print(f"\nBuild complete! `{OUTPUT_FILE}` has been generated successfully.")

if __name__ == "__main__":
    main()