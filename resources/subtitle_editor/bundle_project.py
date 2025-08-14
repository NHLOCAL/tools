import os
import re
import argparse
from collections import deque

def bundle_project(source_dir, output_file):
    """
    Bundles a web project (HTML, CSS, and JS with modules) into a single,
    self-contained HTML file. It handles nested directories and relative JS imports.
    """
    print(f"Starting bundling process for directory: '{source_dir}'")
    
    # --- 1. Find the base HTML file ---
    html_file = None
    output_filename = os.path.basename(output_file)
    for file in os.listdir(source_dir):
        if file.endswith('.html') and file != output_filename:
            html_file = os.path.join(source_dir, file)
            print(f"Found base HTML file: '{html_file}'")
            break
    
    if not html_file:
        print(f"Error: No HTML file found in '{source_dir}'. Aborting.")
        return

    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # --- 2. Process and inline CSS files ---
    print("\n--- Processing CSS ---")
    # Find all <link rel="stylesheet"> tags with local hrefs (ignores http, https, //)
    css_links = re.findall(r'<link\s+[^>]*?rel="stylesheet"[^>]*?href="((?!https?://|//)[^"]+\.css)"[^>]*?>', html_content)
    
    for css_path in css_links:
        # Resolve path relative to source_dir, not the HTML file's dir, for simplicity
        full_css_path = os.path.join(source_dir, css_path)
        if os.path.exists(full_css_path):
            print(f"Inlining CSS from: '{full_css_path}'")
            with open(full_css_path, 'r', encoding='utf-8') as f:
                css_content = f.read()
            
            style_tag = f"<style>\n{css_content}\n</style>"
            # Use a specific regex to replace only the correct link tag
            html_content = re.sub(r'<link\s+[^>]*?href="' + re.escape(css_path) + '"[^>]*?>', style_tag, html_content, count=1)
        else:
            print(f"Warning: CSS file not found: '{full_css_path}'")

    # --- 3. Discover all JavaScript files recursively ---
    print("\n--- Processing JavaScript ---")
    
    js_file_paths = {}
    for root, _, files in os.walk(source_dir):
        for file in files:
            if file.endswith('.js'):
                abs_path = os.path.join(root, file)
                # Use normalized, forward-slash paths relative to source_dir as canonical keys
                rel_path = os.path.relpath(abs_path, source_dir).replace('\\', '/')
                js_file_paths[rel_path] = abs_path
    
    if not js_file_paths:
        print("No JavaScript files found. Skipping JS bundling.")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"\n✅ Success! Project bundled (without JS) into: '{output_file}'")
        return

    # --- 4. Analyze JS dependencies ---
    js_files = list(js_file_paths.keys())
    dependencies = {js_file: [] for js_file in js_files}
    js_contents = {}
    import_regex = re.compile(r"import\s+.*?from\s+['\"]([^'\"]+)['\"];?")

    print("Analyzing JS dependencies...")
    for js_file_rel, js_file_abs in js_file_paths.items():
        with open(js_file_abs, 'r', encoding='utf-8') as f:
            content = f.read()
            js_contents[js_file_rel] = content
            imports = import_regex.findall(content)
            
            current_file_dir = os.path.dirname(js_file_abs)
            for imported_specifier in imports:
                if not imported_specifier.startswith('.'):
                    print(f"  (Skipping non-relative import: '{imported_specifier}' in '{js_file_rel}')")
                    continue
                
                # Assume .js extension if missing, common in module imports
                if not os.path.splitext(imported_specifier)[1]:
                    imported_specifier += '.js'

                imported_file_abs = os.path.normpath(os.path.join(current_file_dir, imported_specifier))
                imported_file_rel = os.path.relpath(imported_file_abs, source_dir).replace('\\', '/')

                if imported_file_rel in js_files:
                    print(f"  '{js_file_rel}' -> '{imported_file_rel}'")
                    dependencies[js_file_rel].append(imported_file_rel)
                else:
                    print(f"Warning: Could not resolve import '{imported_specifier}' in '{js_file_rel}' to a known JS file.")

    # --- 5. Sort JS files based on dependencies (Topological Sort) ---
    adj = {u: [] for u in js_files}
    in_degree = {u: 0 for u in js_files}
    for u, deps in dependencies.items():
        for v in deps:
            if v in adj:
                adj[v].append(u) # if u imports v, create edge v -> u
                in_degree[u] += 1

    queue = deque([u for u in js_files if in_degree[u] == 0])
    sorted_js = []
    while queue:
        u = queue.popleft()
        sorted_js.append(u)
        for v in adj.get(u, []):
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    if len(sorted_js) != len(js_files):
        circular_deps = sorted([f for f, deg in in_degree.items() if deg > 0])
        print(f"\nError: Circular dependency detected in JS files. Bundling may fail.")
        print(f"Files involved in cycle: {circular_deps}")
        sorted_js = js_files # Fallback to original, likely incorrect, order
    else:
        print("\nJS files processing order (dependencies first):")
        for f in sorted_js:
            print(f"- {f}")
            
    # --- 6. Combine sorted JS files into one script ---
    combined_js = []
    import_removal_regex = re.compile(r"^\s*import\s+.*?from\s+['\"].*?['\"];?\s*$", flags=re.MULTILINE)

    for js_file in sorted_js:
        content = js_contents[js_file]
        
        # Remove import statements
        content = import_removal_regex.sub('', content)
        
        # Remove export statements using a simple but effective strategy for this project.
        # It handles `export default ...` and `export const/function/class ...`
        content = re.sub(r'^\s*export\s+default\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
        
        combined_js.append(f"// --- START OF {js_file} ---\n{content.strip()}\n// --- END OF {js_file} ---\n")
        
    final_js_script = "\n".join(combined_js)
    
    # --- 7. Replace local script tags with the single bundled script ---
    # Use a negative lookahead to avoid removing external scripts (http, https, //)
    html_content = re.sub(r'<script\s+[^>]*?src="((?!https?://|//)[^"]+\.js)"[^>]*?>\s*</script>', '', html_content, flags=re.IGNORECASE)
    
    # Inject the bundled script before the closing body tag
    bundled_script_tag = f"<script>\n// Bundled by script\n{final_js_script}\n</script>"
    
    if '</body>' in html_content:
        # Use str.replace() for literal replacement to avoid issues with backslashes in JS code
        html_content = html_content.replace('</body>', f'{bundled_script_tag}\n</body>', 1)
    else:
        # Fallback if no body tag is found
        html_content += bundled_script_tag

    # --- 8. Write the final output ---
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"\n✅ Success! Project bundled into a single file: '{output_file}'")

def main():
    parser = argparse.ArgumentParser(
        description="A simple web project bundler. Combines HTML, CSS, and JS (with modules) into a single HTML file.",
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="This tool performs a basic concatenation of JS modules after a topological sort.\nIt removes 'import' and 'export' statements, so it may not work for complex module patterns."
    )
    parser.add_argument(
        'source_dir',
        nargs='?',
        default='.',
        help='The source directory of the project (default: current directory).'
    )
    parser.add_argument(
        '-o', '--output',
        default='bundled_output.html',
        help='The name of the output bundled HTML file (default: bundled_output.html).'
    )
    args = parser.parse_args()

    bundle_project(args.source_dir, args.output)

if __name__ == "__main__":
    main()