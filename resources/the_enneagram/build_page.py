"""Build the portable single-file tool from its local source files."""
from pathlib import Path
import base64
import re
import json
from html import escape, unescape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def build():
    css = (HERE / 'style.css').read_text(encoding='utf-8')
    font = (HERE / 'fonts/assistant-variable.ttf').read_bytes()
    css = css.replace('INLINE_FONT', base64.b64encode(font).decode('ascii'))
    license_text = (HERE / 'fonts/OFL.txt').read_text(encoding='utf-8')
    license_text = '\n'.join(line.rstrip() for line in license_text.splitlines())
    css = f'/* Embedded Assistant font license:\n{license_text}\n*/\n' + css
    html = (HERE / 'page.html').read_text(encoding='utf-8')
    for marker, content in [('STYLE', css), ('ENGINE', (HERE / 'engine.js').read_text(encoding='utf-8')), ('APP', (HERE / 'app.js').read_text(encoding='utf-8'))]:
        html = html.replace(f'/* INLINE_{marker} */', content)
    # Keep standalone builds complete without running the whole catalog build.
    description = unescape(re.search(r'<meta name="description" content="([^"]*)">', html)[1])
    title = unescape(re.search(r'<title>(.*?)</title>', html)[1])
    site = 'https://' + (ROOT / 'CNAME').read_text(encoding='utf-8').strip()
    url = site + '/tools/the_enneagram.html'
    fields = {'og:type': 'website', 'og:locale': 'he_IL', 'og:title': title,
              'og:description': description, 'og:url': url, 'og:image': site + '/assets/social-card.png'}
    tags = '\n'.join(f'<meta property="{key}" content="{escape(value, quote=True)}">' for key, value in fields.items())
    schema = json.dumps({'@context':'https://schema.org','@type':'WebPage','url':url,
                         'name':title,'description':description,'inLanguage':'he'}, ensure_ascii=False)
    block = f'<link rel="canonical" href="{url}">\n{tags}\n<meta name="twitter:card" content="summary_large_image">\n<script type="application/ld+json">{schema}</script>'
    html = html.replace('</head>', '<!-- catalog metadata:start -->\n' + block + '\n<!-- catalog metadata:end -->\n</head>', 1)
    target = ROOT / 'tools/the_enneagram.html'
    target.write_text(html, encoding='utf-8', newline='\n')
    print(f'Built {target.name}: {len(html.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    build()
