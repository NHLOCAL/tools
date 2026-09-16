"""Build the portable single-file tool from its local source files."""
from pathlib import Path
import base64

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
    target = ROOT / 'tools/the_enneagram.html'
    target.write_text(html, encoding='utf-8', newline='\n')
    print(f'Built {target.name}: {len(html.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    build()
