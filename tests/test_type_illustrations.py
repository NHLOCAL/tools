"""Dependency-free contracts for the sixteen standalone SVG illustrations.

Run: python -m unittest discover -s tests -p 'test_type_illustrations.py' -v
The visual review is separate: these tests do not grade illustration quality.
"""
import pathlib
import unittest
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
ART = ROOT / 'assets' / 'illustrations' / '16-types'
PALETTES = {
    'INTJ': ('#43558B', '#EBEDF7'), 'INTP': ('#745F8B', '#F0EBF5'),
    'ENTJ': ('#933F56', '#F7E9ED'), 'ENTP': ('#A4502B', '#F9ECDF'),
    'INFJ': ('#3B6C59', '#E7F1EB'), 'INFP': ('#5E7034', '#EFF2E2'),
    'ENFJ': ('#267376', '#E4F2EF'), 'ENFP': ('#89641B', '#FBF2D8'),
    'ISTJ': ('#476778', '#E8EFF3'), 'ISFJ': ('#9A5263', '#F7EAEE'),
    'ESTJ': ('#345A8B', '#E7EEF7'), 'ESFJ': ('#A1503E', '#FAEAE3'),
    'ISTP': ('#317469', '#E4F2EE'), 'ISFP': ('#795B98', '#F2EAF9'),
    'ESTP': ('#9B5B20', '#FFF0DE'), 'ESFP': ('#A3477A', '#F9E9F2'),
}
NS = '{http://www.w3.org/2000/svg}'

class TypeIllustrations(unittest.TestCase):
    def test_complete_set(self):
        self.assertEqual({p.stem for p in ART.glob('*.svg')}, set(PALETTES))

    def test_accessible_standalone_vectors_and_palettes(self):
        for code, colors in PALETTES.items():
            with self.subTest(code=code):
                source = (ART / f'{code}.svg').read_text(encoding='utf-8')
                svg = ET.fromstring(source)
                self.assertEqual(svg.tag, NS + 'svg')
                self.assertEqual(svg.get('viewBox'), '0 0 240 240')
                self.assertEqual(svg.get('role'), 'img')
                title = svg.find(NS + 'title')
                description = svg.find(NS + 'desc')
                self.assertIsNotNone(title)
                self.assertIsNotNone(description, 'A meaningful standalone description is required')
                self.assertTrue(title.text.startswith(code + ':'))
                self.assertGreater(len(description.text.strip()), 30)
                self.assertEqual(svg.get('aria-labelledby'), title.get('id'))
                self.assertEqual(svg.get('aria-describedby'), description.get('id'))
                ids = [node.get('id') for node in svg.iter() if node.get('id')]
                self.assertEqual(len(ids), len(set(ids)))
                self.assertTrue(all(i.startswith(code.lower() + '-') for i in ids))
                for color in colors:
                    self.assertIn(color, source)
                self.assertLess(len(source.encode()), 7000)
                for node in svg.iter():
                    self.assertNotIn(node.tag.removeprefix(NS), {
                        'script', 'image', 'foreignObject', 'filter', 'text', 'animate', 'style'})
                    for name, value in node.attrib.items():
                        self.assertFalse(name.lower().startswith('on'))
                        self.assertFalse(name.endswith('href'))
                        self.assertNotIn('url(', value)
                self.assertNotRegex(source, r'(?i)<!DOCTYPE|<!ENTITY|data:image|base64')

    def test_set_size(self):
        self.assertLess(sum(p.stat().st_size for p in ART.glob('*.svg')), 95000)

if __name__ == '__main__':
    unittest.main()
