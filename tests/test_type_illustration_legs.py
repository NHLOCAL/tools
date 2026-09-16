"""Regressions for ankle-centred footwear; visual quality is reviewed separately."""
import importlib.util
import math
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('art', ROOT / 'scripts/redraw_16_type_illustrations.py')
ART = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ART)
NS = '{http://www.w3.org/2000/svg}'

class AnkleGeometryTests(unittest.TestCase):
    def test_cuff_edges_share_the_ankle_centre_at_every_rotation(self):
        self.assertTrue(hasattr(ART, 'ankle_edges'))
        for angle in (0, 15, -28, 105):
            left, right = ART.ankle_edges(85, 204, 14, angle)
            self.assertAlmostEqual((left[0] + right[0]) / 2, 85)
            self.assertAlmostEqual((left[1] + right[1]) / 2, 204)
            self.assertAlmostEqual(math.dist(left, right), 14)

    def test_mirroring_keeps_the_whole_collar_under_the_ankle(self):
        for flipped in (False, True):
            shoe = ET.fromstring(ART.shoe(90, 204, flip=flipped))
            d = shoe.find('path').get('d')
            collar = re.match(r'M\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*H\s*(-?[\d.]+)', d)
            self.assertIsNotNone(collar)
            left, y, right = map(float, collar.groups())
            self.assertLess(left, 0, 'The ankle cannot sit at one edge of the shoe')
            self.assertAlmostEqual(left, -right)
            self.assertLess(y, 0, 'The collar must overlap the trouser hem')
            self.assertEqual(shoe.get('transform'), f'translate(90 204) rotate(0) scale({-1 if flipped else 1} 1)')

    def test_trouser_hem_uses_the_shoe_anchor_and_overlaps_its_collar(self):
        self.assertTrue(hasattr(ART, 'leg'))
        group = ET.fromstring(ART.leg('M80 160 L{L} L{R} L100 160Z', (90, 204), '#263D48', flip=True, angle=15, cuff=14))
        shoe, trousers = list(group)
        self.assertEqual(shoe.get('data-part'), 'shoe')
        self.assertEqual(trousers.get('data-part'), 'trousers')
        self.assertEqual(shoe.get('transform'), 'translate(90 204) rotate(15) scale(-1 1)')
        for edge in ART.ankle_edges(90, 204, 14, 15):
            self.assertIn(ART.point(edge), trousers.get('d'))

    def test_each_character_has_exactly_two_integrated_leg_shoe_pairs(self):
        for source in (ROOT / 'assets/illustrations/16-types').glob('*.svg'):
            with self.subTest(code=source.stem):
                svg = ET.parse(source).getroot()
                legs = [node for node in svg.iter(NS + 'g') if node.get('data-part') == 'leg']
                self.assertEqual(len(legs), 2)
                for leg in legs:
                    self.assertEqual([node.get('data-part') for node in leg], ['shoe', 'trousers'])

if __name__ == '__main__':
    unittest.main()
