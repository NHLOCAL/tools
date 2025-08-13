import os
import re
import argparse
from collections import deque

def bundle_project(source_dir, output_file):
    """
    Bundles a web project (HTML, CSS, JS with modules) into a single HTML file.
    """
    print(f"Starting bundling process for directory: '{source_dir}'")
    
    # --- 1. Find the base HTML file ---
    html_file = None
    for file in os.listdir(source_dir):
        if file.endswith('.html'):
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
    css_links = re.findall(r'<link\s+[^>]*?rel="stylesheet"[^>]*?href="([^"]+\.css)"[^>]*?>', html_content)
    
    for css_path in css_links:
        full_css_path = os.path.join(source_dir, css_path)
        if os.path.exists(full_css_path):
            print(f"Inlining CSS from: '{full_css_path}'")
            with open(full_css_path, 'r', encoding='utf-8') as f:
                css_content = f.read()
            
            style_tag = f"<style>\n{css_content}\n</style>"
            # Replace the original link tag with the inlined style
            html_content = re.sub(r'<link\s+[^>]*?href="' + re.escape(css_path) + '"[^>]*?>', style_tag, html_content, count=1)
        else:
            print(f"Warning: CSS file not found: '{full_css_path}'")

    # --- 3. Process and bundle JavaScript modules ---
    print("\n--- Processing JavaScript ---")
    js_files = [f for f in os.listdir(source_dir) if f.endswith('.js')]
    
    dependencies = {js_file: [] for js_file in js_files}
    js_contents = {}
    import_regex = re.compile(r"import\s+.*?from\s+['\"](\./)?([^'\"]+\.js)['\"];?")

    print("Analyzing JS dependencies...")
    for js_file in js_files:
        path = os.path.join(source_dir, js_file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            js_contents[js_file] = content
            imports = import_regex.findall(content)
            for _, imported_file in imports:
                print(f"'{js_file}' depends on '{imported_file}'")
                dependencies[js_file].append(imported_file)

    # --- 4. Sort JS files based on dependencies (Topological Sort) ---
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
        print("Error: Circular dependency detected in JS files. Aborting JS bundling.")
        sorted_js = js_files # Fallback to original order
    else:
        print("\nJS files processing order (dependencies first):")
        for f in sorted_js:
            print(f"- {f}")
            
    # --- 5. Combine sorted JS files into one script ---
    combined_js = []
    for js_file in sorted_js:
        content = js_contents[js_file]
        
        # Remove import statements
        content = import_regex.sub('', content)
        
        # Remove export statements
        content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
        
        combined_js.append(f"// --- START OF {js_file} ---\n{content.strip()}\n// --- END OF {js_file} ---\n")
        
    final_js_script = "\n".join(combined_js)
    
    # --- 6. Replace all script tags with the single bundled script ---
    # First, remove all existing script tags pointing to local .js files
    html_content = re.sub(r'<script\s+[^>]*?src="[^"]+\.js"[^>]*?>\s*</script>', '', html_content, flags=re.IGNORECASE)
    
    # Then, inject the bundled script before the closing body tag
    bundled_script_tag = f"<script>\n// Bundled by script\n{final_js_script}\n</script>"
    
    # ================================================================= #
    # === THE FIX IS HERE ===
    # Use str.replace() for literal replacement instead of re.sub()
    # to avoid "bad escape" errors from backslashes in the JS code.
    html_content = html_content.replace('</body>', f'{bundled_script_tag}\n</body>', 1)
    # ================================================================= #

    # --- 7. Write the final output ---
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"\n✅ Success! Project bundled into a single file: '{output_file}'")


def main():
    parser = argparse.ArgumentParser(
        description="A simple web project bundler. Combines HTML, CSS, and JS (with modules) into a single HTML file.",
        formatter_class=argparse.RawTextHelpFormatter
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