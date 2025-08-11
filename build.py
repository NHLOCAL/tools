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

# ביטוי רגולרי למציאת פריטי רשימה בפורמט: * [Name](path) - Description
TOOL_PATTERN = re.compile(r"^\*\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)$")

# תבנית HTML מעודכנת עבור פריט, ללא סימן V
TOOL_ITEM_TEMPLATE = """
<div class="tool-item" id="{tool_id}">
    <div class="tool-main-content">
        <a href="#{tool_id}" class="link-icon" onclick="copyDirectLink(this, event)" title="העתק קישור ישיר">
            <i data-feather="hash"></i>
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

RESOURCES_BUTTON_TEMPLATE = '        <a href="https://github.com/{user}/{repo}/tree/main/resources/{tool_name}"><i data-feather="folder"></i> משאבים</a>'

def generate_tools_html(lines):
    """מקבל רשימת שורות ומייצר את ה-HTML עבור הכלים."""
    html_output = []
    for line in lines:
        match = TOOL_PATTERN.match(line.strip())
        if match:
            name, path, description = [s.strip() for s in match.groups()]
            filename = path.split('/')[-1]
            
            tool_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
            
            tool_name = tool_id
            resources_path = os.path.join('resources', tool_name)
            resources_button_html = ""
            if os.path.isdir(resources_path):
                resources_button_html = RESOURCES_BUTTON_TEMPLATE.format(
                    user=GITHUB_USERNAME,
                    repo=GITHUB_REPO_NAME,
                    tool_name=tool_name
                )
            
            html_output.append(TOOL_ITEM_TEMPLATE.format(
                name=name,
                description=description,
                path=path,
                filename=filename,
                user=GITHUB_USERNAME,
                repo=GITHUB_REPO_NAME,
                tool_id=tool_id,
                resources_button=resources_button_html
            ))
    return "\n".join(html_output)

def main():
    """הפונקציה הראשית שבונה את האתר."""
    print(f"Reading content from {README_FILE}...")
    try:
        with open(README_FILE, 'r', encoding='utf-8') as f:
            readme_content = f.read()
    except FileNotFoundError:
        print(f"Error: The file {README_FILE} was not found.")
        return

    try:
        before_tools, rest = readme_content.split('## הכלים', 1)
    except ValueError:
        print(f"Error: Could not find the '## הכלים' heading in {README_FILE}.")
        return

    next_heading_match = re.search(r'^\s*#{1,6}\s', rest, flags=re.MULTILINE)
    
    if next_heading_match:
        split_index = next_heading_match.start()
        tools_section = rest[:split_index]
        after_tools = rest[split_index:]
    else:
        tools_section = rest
        after_tools = ""

    markdown_converter = Markdown(extras=["fenced-code-blocks", "tables", "cuddled-lists"])
    html_before = markdown_converter.convert(before_tools.strip())
    
    # --- הוספת ה-Favicon לכותרת הראשית ---
    html_before = re.sub(r'<h1>(.*?)</h1>', r'<h1><img src="favicon.png" alt="" class="favicon-title" aria-hidden="true" /> \1</h1>', html_before, 1)

    html_after = markdown_converter.convert(after_tools.strip())

    tools_lines = [line for line in tools_section.strip().split('\n') if line.strip()]
    tools_html = generate_tools_html(tools_lines)
    
    final_content_html = f"{html_before}\n<h2><i data-feather='tool'></i> הכלים</h2>\n{tools_html}\n{html_after}"

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