import re

# Define file paths
HTML_FILE = 'index.html'
CSS_FILE = 'style.css'
PARSER_JS_FILE = 'parser.js'
MAIN_JS_FILE = 'main.js'
OUTPUT_FILE = 'subtitle_editor_unified.html'

def read_file(filepath):
    """Reads the content of a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: File not found at '{filepath}'")
        return None

def main():
    """Main function to unify HTML, CSS, and JS files."""
    print("Starting file unification process...")

    # 1. Read all source files
    html_content = read_file(HTML_FILE)
    css_content = read_file(CSS_FILE)
    parser_js_content = read_file(PARSER_JS_FILE)
    main_js_content = read_file(MAIN_JS_FILE)

    if not all([html_content, css_content, parser_js_content, main_js_content]):
        print("One or more source files could not be read. Aborting.")
        return

    # 2. Embed CSS into HTML
    print(f"Embedding CSS from '{CSS_FILE}'...")
    # Replace the link tag with an inline <style> tag
    css_link_pattern = r'<link rel="stylesheet" href="style\.css">'
    inline_css = f'<style>\n{css_content}\n</style>'
    unified_html = re.sub(css_link_pattern, inline_css, html_content)
    
    # 3. Prepare and combine JavaScript files
    print(f"Combining JavaScript files: '{PARSER_JS_FILE}' and '{MAIN_JS_FILE}'...")
    
    # Remove 'export' from parser.js
    parser_js_content_no_export = re.sub(r'export\s+(function|const)', r'\1', parser_js_content)
    
    # Remove 'import' from main.js
    main_js_content_no_import = re.sub(r'import\s+.*?from\s+.*?;\s*', '', main_js_content)

    # Combine the JS files. Parser must come first.
    combined_js = f"""
// --- Start of {PARSER_JS_FILE} ---
{parser_js_content_no_export}
// --- End of {PARSER_JS_FILE} ---

// --- Start of {MAIN_JS_FILE} ---
{main_js_content_no_import}
// --- End of {MAIN_JS_FILE} ---
"""
    
    # 4. Embed combined JavaScript into HTML
    print("Embedding combined JavaScript...")
    # Replace the script tag with an inline <script> tag
    js_link_pattern = r'<script type="module" src="main\.js"></script>'
    inline_js = f'<script>\n{combined_js}\n</script>'
    unified_html = re.sub(js_link_pattern, inline_js, unified_html, flags=re.DOTALL)

    # 5. Write the final unified HTML file
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(unified_html)
        print(f"\nSuccessfully created unified file: '{OUTPUT_FILE}'")
    except IOError as e:
        print(f"Error writing to output file: {e}")

if __name__ == '__main__':
    main()