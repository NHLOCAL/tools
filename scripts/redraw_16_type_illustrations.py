"""Rebuild the sixteen original, self-contained personality illustrations.

Run from any directory: python scripts/redraw_16_type_illustrations.py
Uses only Python's standard library and the existing palettes.json.
The SVG files remain the inputs to resources/the_16_types/build.cjs.
"""
from pathlib import Path
from html import escape
import json
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'illustrations' / '16-types'
PALETTES = {code: (value['accent'], value['soft']) for code, value in json.loads((OUT / 'palettes.json').read_text(encoding='utf-8')).items()}
ET.register_namespace('', 'http://www.w3.org/2000/svg')
INK='#263D48'; PAPER='#FFF9ED'; GOLD='#E6B65D'
SKINS=[('#EDC2A1','#D89C77'),('#E3AF87','#C98963'),('#BF825B','#965C40'),('#9A6247','#7D4A36')]

def el(tag, **attrs):
    return '<'+tag+''.join(' '+k.replace('_','-')+'="'+str(v)+'"' for k,v in attrs.items())+'/>'
def p(d, fill='none', **attrs): return el('path', d=d, fill=fill, **attrs)
def c(x,y,r,fill,**attrs): return el('circle',cx=x,cy=y,r=r,fill=fill,**attrs)
def rect(x,y,w,h,r,fill,**attrs): return el('rect',x=x,y=y,width=w,height=h,rx=r,fill=fill,**attrs)
def g(content, **attrs): return '<g'+''.join(' '+k.replace('_','-')+'="'+str(v)+'"' for k,v in attrs.items())+'>'+content+'</g>'
def limb(d, color, width=14):
    return p(d,stroke=INK,stroke_width=width+2.6)+p(d,stroke=color,stroke_width=width)
def shoe(x,y,flip=False,color=INK,angle=0):
    return g(p('M0 0H14Q18 4 26 5Q30 6 29 11H-1Q-4 8 0 0Z',color)+p('M0 9H27',stroke=PAPER if color==INK else INK,stroke_width=1,opacity='.38'),transform=f'translate({x} {y}) rotate({angle}) scale({-1 if flip else 1} 1)')
def hand(x,y,skin=0,angle=0,kind='grip'):
    s,sh=SKINS[skin]
    if kind=='open':
        art=p('M-4 6-7-1Q-9-5-7-6Q-5-7-3-3L-2-9Q-2-12 0-11L3-4 6-8Q8-9 9-7L7 2Q6 7 2 8Z',s)+p('M-3-2 1 2',stroke=sh,stroke_width=1)
    else:
        art=p('M-5 3V-4Q-5-7-2-7H3Q7-7 7-3V3Q6 8 1 8Q-3 8-5 3Z',s)+p('M-5 0-1-2Q2-3 3 0L0 3',stroke=sh,stroke_width=1)
    return g(art,transform=f'translate({x} {y}) rotate({angle})')

def head(x,y,skin=0,hair='#594335',style='sweep',beard=False,moustache=False,glasses=False,angle=0,mood='smile'):
    s,sh=SKINS[skin]
    out=rect(-6,17,12,16,3,s)+p('M-5 21Q0 26 6 22V28Q0 30-5 27Z',sh,stroke='none')
    out+=el('ellipse',cx=-16.5,cy=3,rx=3.5,ry=5,fill=s)+el('ellipse',cx=16.5,cy=3,rx=3.5,ry=5,fill=s)
    out+=p('M-16-12Q-16-24 0-24Q16-24 16-12V7Q15 21 0 24Q-14 22-16 8Z',s)
    hairs={
        'sweep':'M-16 4Q-23-13-13-21Q-4-30 8-25Q16-25 19-17Q23-14 18-9L14-7Q6-9 0-16Q-5-9-12-9L-12 3Z',
        'curly':'M-16 4Q-23 0-20-7Q-25-14-18-18Q-21-26-11-26Q-5-33 2-28Q10-33 15-26Q24-25 20-17Q25-10 18-5L15 3 12-7Q5-4 0-10Q-5-5-12-7L-12 4Z',
        'short':'M-16 3Q-20-9-16-17Q-12-25 0-25Q14-26 17-16L16 2H13V-12Q0-8-12-12V3Z',
        'wave':'M-16 4Q-22-5-17-12Q-21-22-10-23Q-3-30 5-25Q16-29 18-18Q24-13 17-5L13 2V-9Q3-4-4-13Q-8-7-12-8V4Z',
        'silver':'M-16 4Q-21-14-12-20Q0-29 13-20Q21-16 17 3L13 2 12-11Q-1-7-8-16L-12-10V4Z',
        'bald':'M-16 5Q-21-9-15-16L-10-20V-13L-12-6V5ZM11-20Q21-12 17 5L13 4V-8Z',
        'cap':'M-18-7Q-19-26-1-28Q14-29 18-11L24-7Q27-3 22-2H-12V5H-16Z',
    }
    out+=p(hairs[style],hair,stroke=hair)
    if style=='cap':out+=p('M-16-8Q4-12 20-6M-4-24Q4-22 7-13',stroke=PAPER,stroke_width=1.2,opacity='.48')
    if style=='silver':out+=p('M-10-20Q-4-23 2-21',stroke=PAPER,stroke_width=1.4,opacity='.65')
    if beard:
        out+=p('M-15 6-10 10-5 10 0 8 6 10 11 9 15 5 13 16Q8 24 0 24Q-10 22-14 15Z',hair,stroke=hair)
    # Faces deliberately use few, legible marks rather than tiny stacked details.
    brow='M-11-2Q-7-4-3-2M4-2Q8-4 12-2' if mood!='thought' else 'M-11-2-4-3M4-3 11-1'
    out+=p(brow,stroke=hair,stroke_width=1.4)
    out+=c(-7,3,1.15,INK,stroke='none')+c(8,3,1.15,INK,stroke='none')
    out+=p('M1 4-1 9 2 10',stroke=sh,stroke_width=1.2)
    if glasses == 'sun':
        out+=p('M-14-1H-2L-3 6Q-8 9-12 5ZM3-1H15L13 6Q8 9 4 5Z',INK)+p('M-2 0H3M-10 0H-6M7 0H11',stroke=PAPER,stroke_width=1)
    elif glasses:
        out+=g(c(-7,3,5.8,'none')+c(8,3,5.8,'none')+p('M-1 2H2M-16 1-13 2M14 2 17 1'),stroke_width=1.2)
    if moustache:
        out+=p('M-9 13Q-4 9 0 12Q5 9 10 13Q7 17 1 14Q-5 17-9 13Z',hair,stroke='none')
        out+=p('M-3 19Q1 21 5 18',stroke=INK,stroke_width=1.1)
    elif mood=='thought':out+=p('M-4 15 4 14',stroke=PAPER if beard else INK,stroke_width=1.3)
    else:out+=p('M-5 14Q0 19 6 14',stroke=PAPER if beard else INK,stroke_width=1.4)
    return g(out,transform=f'translate({x} {y}) rotate({angle})')

def torso(x,color,shade=None,kind='jacket',angle=0):
    shade=shade or color
    if kind=='sweater':
        art=p('M-10 96Q-28 99-28 110L-24 157Q0 164 26 157L25 108Q22 99 10 96Z',color)
        art+=p('M-10 97Q0 110 11 97',stroke=PAPER,stroke_width=4)
        art+=p('M-21 152Q0 158 23 152',stroke=shade,stroke_width=1.3)
    else:
        art=p('M-10 96Q-26 97-28 109L-24 158Q0 163 26 156L25 109Q23 99 10 96Z',color)
        art+=p('M-9 97 0 104 10 97 12 156-7 159Z',PAPER,stroke='none')
        if kind=='vest':
            art+=p('M-13 96-1 115 12 96 24 105 22 156 3 161-2 156-23 159-25 105Z',shade)
            art+=p('M0 116V151',stroke=PAPER,stroke_width=1,opacity='.45')
            art+=c(5,132,1,PAPER,stroke='none')+c(6,143,1,PAPER,stroke='none')
        else:
            art+=p('M-11 96-2 104-10 122-20 108Z',shade,stroke='none')+p('M11 96 2 104 12 121 21 107Z',shade,stroke='none')
            art+=p('M-10 124-11 154M13 125 16 153',stroke=PAPER,stroke_width=1,opacity='.28')
    return g(art,transform=f'translate({x} 0) rotate({angle} 0 126)')

def standing(x=116, pants=INK, shade='#415363', spread=0):
    return g(p('M-23 153H1L-4 201H-20Z',pants)+p(f'M1 153H24L{30+spread} 200 {14+spread} 203 4 174Z',shade)+shoe(-22,200,True)+shoe(13+spread,201),transform=f'translate({x} 0)')

def compact_inherited_styles(svg):
    """Remove only redundant inherited presentation attributes, not geometry."""
    keys = ('fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin')
    def visit(node, inherited):
        current = inherited.copy()
        for key in keys:
            if key in node.attrib:
                value = node.get(key)
                if inherited.get(key) == value:
                    del node.attrib[key]
                current[key] = value
        for child in node:
            visit(child, current)
    root = ET.fromstring(svg)
    # Whitespace between shapes is irrelevant and is reapplied consistently below.
    for node in root.iter():
        if node.text is not None and not node.text.strip(): node.text = None
        node.tail = None
    visit(root, {'fill': 'black', 'stroke': 'none', 'stroke-width': '1',
                 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter'})
    return ET.tostring(root, encoding='unicode').replace(' />', '/>').replace('><', '>\n<') + '\n'

def write(code,title,desc,body):
    accent,soft=PALETTES[code]
    start=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-labelledby="{code.lower()}-title" aria-describedby="{code.lower()}-desc">\n<title id="{code.lower()}-title">{code}: {escape(title)}</title>\n<desc id="{code.lower()}-desc">{escape(desc)}</desc>\n'
    bg=c(120,122,84,soft)+el('ellipse',cx=120,cy=216,rx=65,ry=3,fill=INK,opacity='.08')
    svg=start+bg+'\n'+g(body,fill='none',stroke=INK,stroke_width='1.4',stroke_linecap='round',stroke_linejoin='round')+'\n</svg>\n'
    # Keep each SVG readable while avoiding redundant attributes and giant path lines.
    svg=compact_inherited_styles(svg)
    (OUT/f'{code}.svg').write_text(svg, encoding='utf-8', newline='\n')
    return svg

def intj():
    a,s=PALETTES['INTJ']; skin=1
    art=standing(117,INK,'#344B5E')
    art+=limb('M94 107Q83 116 77 140',a)+limb('M139 107Q151 119 157 139',a)
    art+=torso(117,a,'#364673')+head(117,67,skin,INK,glasses=True,angle=-5,mood='thought')
    # An actual folded three-panel plan, gripped at both outside edges.
    art+=g(p('M72 135 99 130 127 135 157 128V165L128 172 99 167 72 172Z','#B9CFDE')+p('M99 130 127 135 128 172 99 167Z','#DCE7EF',stroke='none')+p('M99 134V164M127 139V168',stroke=a,opacity='.45')+p('M79 145 91 142V155H85V161M106 159V143L120 146V163M134 159V145L149 141V156',stroke=a,stroke_width=1.5)+p('M108 150 119 152M141 145V157',stroke=a,stroke_width=1),stroke=a)
    art+=hand(73,149,skin,-8)+hand(156,146,skin,14)
    write('INTJ','The architect with a folded blueprint','A bespectacled male architect in an indigo jacket studies a three-panel architectural plan. His balanced stance and precise drawing convey quiet planning.',art)

def intp():
    a,s=PALETTES['INTP'];skin=0
    art=rect(67,165,63,7,3,'#B8A28E')+p('M74 173 69 212M122 173 131 212',stroke='#A28A75',stroke_width=4)
    art+=p('M97 152Q123 150 139 167L152 191 139 198 120 176 94 175Z','#384954')
    art+=p('M79 153H106L100 180 85 196 106 202 102 215 72 207Q64 204 70 193L83 174Z',INK)
    art+=shoe(101,207)+shoe(140,194,angle=13)
    art+=limb('M82 107Q64 127 78 144L105 146',a)
    art+=limb('M128 107 142 126Q146 129 152 123L165 102',a)
    art+=torso(106,a,'#9680AA')+limb('M77 141Q86 146 103 146',a,12)+hand(106,145,skin,83)
    art+=head(105,68,skin,'#594335','curly',beard=True,glasses=True,angle=8,mood='thought')
    art+=p('M166 102V83',stroke=a,stroke_width=2)
    art+=g(el('ellipse',cx=174,cy=66,rx=25,ry=9,transform='rotate(-32 174 66)')+el('ellipse',cx=174,cy=66,rx=25,ry=9,transform='rotate(48 174 66)'),stroke=a,stroke_width=1.6)
    art+=c(174,66,5.7,GOLD,stroke='none')+c(193,52,3,a,stroke=PAPER,stroke_width=1)+hand(166,103,skin,17)
    write('INTP','The thinker with an orbital model','A curly-haired, bearded male thinker in a lavender jacket sits on a wooden stool. He studies a small orbital model held carefully at eye level.',art)

def entj():
    a,s=PALETTES['ENTJ'];skin=3
    art=p('M139 215V192H166V172H192V150H214V215Z','#E8C8CE',stroke='none')+p('M166 191H191M192 171H212',stroke=a,opacity='.25')
    art+=p('M84 152H108L104 202H86Z',INK)+p('M108 151 131 149Q142 150 151 160L154 180H138L136 170 114 174Z','#374A57')+shoe(85,201,True)+shoe(139,181)
    art+=limb('M87 107 72 133Q70 143 93 147',a)+limb('M133 107 152 122Q156 123 160 115L177 88',a)
    art+=torso(108,a,'#7B3549')+p('M106 106 111 106 115 132 111 138 106 132Z',GOLD,stroke='none')
    art+=limb('M73 136Q76 144 91 146',a,12)+hand(95,145,skin,75)+head(108,66,skin,INK,'short',moustache=True,angle=-4)
    art+=g(p('M-5 7-6-3Q-7-8-3-8L0-6 2-20Q3-24 5-21L6-5 10-2 9 7Q5 12 0 11Z',SKINS[skin][0])+p('M0-5 4-2',stroke=SKINS[skin][1],stroke_width=1),transform='translate(177 82) rotate(19)')
    write('ENTJ','The leader indicating the next step','A confident moustached male leader wears a burgundy suit. One foot is on a low step and one hand points forward and upward along a clear staircase.',art)

def entp():
    a,s=PALETTES['ENTP'];skin=1
    art=p('M97 153 120 156 109 184 90 207 77 199 94 172Z',INK)+p('M120 155 142 151 143 180 161 201 148 211 126 188Z','#415363')+shoe(81,200,True,angle=-7)+shoe(150,202,angle=12)
    art+=limb('M98 107 77 130Q72 135 66 128L49 108',a)+limb('M141 109 158 132Q162 137 169 130L188 105',a)
    art+=torso(119,a,'#D17A4D',angle=4)+head(117,66,skin,'#8E5038','wave',angle=8)
    art+=hand(46,105,skin,-35,'open')+hand(190,103,skin,38,'open')
    art+=g(p('M32 68 48 59 64 68V86L48 95 32 86Z','#6D889E')+p('M32 68 48 77 64 68M48 77V95',stroke=PAPER,stroke_width=1.3),stroke='#476778')
    art+=g(p('M179 69 192 48 207 69 193 90Z',GOLD)+p('M192 48 193 90M179 69H207',stroke=PAPER,stroke_width=1.3),stroke=a)
    write('ENTP','The inventor comparing two ideas','An expressive male inventor in a rust jacket compares a blue cube and a golden geometric solid. Open palms and an asymmetric stance suggest lively curiosity.',art)

def infj():
    a,s=PALETTES['INFJ'];skin=2
    art=standing(113,INK,'#354F48',spread=1)
    art+=limb('M89 108Q68 132 79 145L103 148',a)+limb('M138 108Q152 121 170 149',a)
    art+=torso(113,a,'#50836D')+limb('M78 142Q85 148 103 148',a,12)+hand(106,149,skin,85)
    art+=head(113,67,skin,'#364238','sweep',beard=True,angle=-4,mood='thought')
    art+=g(el('ellipse',cx=175,cy=162,rx=7,ry=9)+p('M161 174 165 170H185L189 174 185 204H165Z',INK)+p('M165 171 170 166H181L185 171Z',a)+p('M166 177H184L181 199H169Z',GOLD,stroke='none')+p('M175 181Q166 193 175 196Q184 193 175 181Z',PAPER,stroke='none')+p('M164 204H186',stroke_width=3))
    art+=hand(172,151,skin,-21)
    write('INFJ','The guide carrying a lantern','A contemplative bearded male guide in a forest-green coat carries a warm lantern by its handle. A quiet stance and a small flame suggest insight and guidance.',art)

def infp():
    a,s=PALETTES['INFP'];skin=0
    art=rect(67,166,55,43,9,'#D1D8B9',stroke='none')+p('M72 174H117',stroke=a,opacity='.25')
    art+=p('M87 155 108 157 103 185 88 204H73L88 177Z','#415340')
    art+=p('M106 153Q125 151 143 173Q149 180 143 188L128 204 115 196 129 180 107 177Z',INK)+shoe(77,202,True)+shoe(119,199,angle=20)
    art+=limb('M82 108Q67 126 81 145L100 150',a)+limb('M127 108Q146 121 152 140',a)
    art+=torso(104,a,'#889A56')+head(103,69,skin,'#624A39','wave',angle=8)
    art+=limb('M79 143 100 151',a,12)
    art+=g(p('M96 140Q110 137 124 145Q138 135 156 138L153 168Q139 166 126 176Q110 169 97 172Z','#E8D4A8')+p('M99 139Q111 137 124 144Q140 134 153 137L150 164Q137 164 125 172Q112 166 100 168Z',PAPER)+p('M124 145 125 171M105 145 117 148M105 151 117 154M132 147 146 143M132 153 145 149',stroke=a,stroke_width=1.2),stroke=a)
    art+=hand(98,156,skin,-9)+hand(154,153,skin,9)
    write('INFP','The reader absorbed in a book','A gentle male reader in an olive jacket sits on a small cushion. He leans toward an open book, with both hands resting naturally on the page edges.',art)

def enfj():
    a,s=PALETTES['ENFJ'];skin=2
    art=standing(118,INK,'#34565A',spread=4)
    art+=limb('M95 107 75 137Q71 143 63 138L39 124',a)+limb('M141 107 166 134Q171 140 178 134L200 118',a)
    art+=torso(118,a,'#479392')+hand(31,122,skin,-57,'open')+hand(207,113,skin,47,'open')
    art+=head(118,66,skin,'#383932','curly',beard=True)
    art+=g(p('M169 41H196Q205 41 205 50V65Q205 73 196 73H182L173 81V73H169Q161 73 161 65V50Q161 41 169 41Z',a,stroke='none')+p('M175 54Q178 49 183 54Q189 49 192 54Q194 59 183 66Q172 60 175 54Z',PAPER,stroke='none'))
    write('ENFJ','The guide welcoming connection','A smiling bearded male guide in a teal jacket opens both hands in welcome. A small heart in a speech bubble reinforces empathy and connection.',art)

def enfp():
    a,s=PALETTES['ENFP'];skin=1;coat='#C19435'
    art=p('M91 153 113 157 99 181 74 201 61 190 84 169Z',INK)+p('M113 157 136 153 141 180 158 203 144 212 121 187Z','#4E5146')+shoe(65,192,True,angle=14)+shoe(146,204,angle=3)
    art+=limb('M88 105Q74 122 61 148',coat)+limb('M132 106 151 107Q158 107 160 98L164 79',coat)
    art+=torso(108,coat,a,angle=-5)+head(108,66,skin,'#684D35','wave',angle=-10)+hand(57,155,skin,15)
    art+=g(p('M157 47 185 24 209 52 181 80Z',coat)+p('M185 24 181 80 173 48Z',PAPER,stroke='none')+p('M157 47 209 52M185 24 181 80',stroke=a,stroke_width=1.3)+p('M181 80Q168 95 164 79M181 80Q183 99 200 106Q181 114 198 124',stroke=a,stroke_width=1.2)+p('M184 97 193 94 191 103Z',coat)+p('M192 116 201 113 200 122Z',coat),stroke=a)
    art+=hand(164,80,skin,8)
    write('ENFP','The explorer lifting a kite','An enthusiastic male explorer in a golden jacket moves forward while lifting a diamond-shaped kite. A clearly connected string and a light tail echo his lively pose.',art)

def istj():
    a,s=PALETTES['ISTJ'];skin=0
    art=standing(119,'#B9A489','#D0BDA0')
    art+=limb('M96 107Q83 120 78 152',PAPER)+limb('M141 107Q161 126 150 138L113 152',PAPER)
    art+=torso(119,PAPER,a,kind='vest')+p('M116 106 122 106 124 124 119 131 115 124Z','#AE7C4E',stroke='none')
    art+=head(118,67,skin,'#4D4840','sweep',moustache=True,angle=-3)
    art+=g(rect(61,126,43,60,4,a)+rect(65,131,35,50,2,PAPER,stroke='none')+rect(74,122,18,10,3,'#A3B5BD')+p('M71 143 74 146 79 139M85 143H94M71 156 74 159 79 152M85 156H94M71 169 74 172 79 165M85 169H94',stroke=a,stroke_width=1.6),transform='rotate(-8 84 154)')
    art+=hand(65,157,skin,-12)
    art+=limb('M149 135 119 149',PAPER,12)+p('M94 165 114 143',stroke=INK,stroke_width=2)+p('M93 169 94 164 97 166Z',GOLD,stroke='none')+hand(111,150,skin,57)
    write('ISTJ','The organiser checking a clipboard','A meticulous moustached man in a slate-blue waistcoat checks a three-item clipboard with a pencil. Clear marks, neat sleeves and a steady posture convey care and order.',art)

def isfj():
    a,s=PALETTES['ISFJ'];skin=1
    art=standing(119,'#43554C',INK)
    art+=limb('M94 107Q72 128 84 145L105 161',a)+limb('M143 107Q165 128 154 146L134 161',a)
    art+=torso(119,a,'#BA7786')+head(119,67,skin,'#66513F','bald',beard=True,angle=1)
    art+=limb('M83 141Q85 153 108 166',a,12)+limb('M155 141Q151 154 132 166',a,12)
    art+=g(p('M104 146H135L131 174Q119 178 109 174Z','#BA7C55')+rect(101,142,37,7,2,'#D59A6C')+p('M119 142V113',stroke='#597953',stroke_width=2)+p('M118 131Q97 133 98 114Q117 113 118 131Z','#6A925E',stroke='none')+p('M120 122Q117 102 138 102Q139 122 120 122Z','#8BA976',stroke='none')+p('M104 119 117 131M121 119 133 107',stroke='#C7D9AB',stroke_width=1.2),stroke='#965C40')
    art+=g(p('M98 158Q102 155 107 161L109 169 119 171Q122 174 118 177L107 175Q100 174 96 167Z',SKINS[skin][0])+p('M140 157Q136 155 133 161L130 169 122 171Q119 174 122 177L134 175Q141 173 144 166Z',SKINS[skin][0])+p('M107 168 113 172M133 168 128 172',stroke=SKINS[skin][1],stroke_width=1))
    write('ISFJ','The gardener protecting a young plant','A kindly balding, bearded male gardener in a rose cardigan cups a terracotta pot in both hands. Two fresh green leaves are the gentle focal point.',art)

def estj():
    a,s=PALETTES['ESTJ'];skin=0
    art=standing(101,INK,'#40556D')
    art+=limb('M79 108Q66 128 62 152',a)+limb('M124 108 145 133 174 133',a)
    art+=torso(101,a,'#274973')+p('M99 106 105 106 108 132 103 138 98 132Z','#CF9555',stroke='none')+hand(60,160,skin,-9)
    art+=head(101,67,skin,'#A8ADB0','silver',glasses=True,angle=-3,mood='thought')
    art+=rect(150,165,60,7,2,'#AF987D')+p('M158 173 152 211M202 173 209 211',stroke='#A18B76',stroke_width=4)
    art+=rect(155,152,14,12,2,'#7798B8',stroke='none')+rect(175,140,14,24,2,a,stroke='none')+rect(195,126,14,38,2,'#C3D4E7',stroke='none')+p('M158 157H165M178 145H185M198 131H205',stroke=PAPER,stroke_width=1.4)
    art+=hand(177,134,skin,90)
    write('ESTJ','The organiser arranging clear steps','A silver-haired male organiser in a blue suit arranges three ascending blocks on a small wooden table. His glasses and measured gesture emphasise practical structure.',art)

def esfj():
    a,s=PALETTES['ESFJ'];skin=1
    art=standing(121,'#BCB09A','#D5C6AA')
    art+=limb('M96 107 78 140Q75 145 66 141L52 135',PAPER)+limb('M144 107 164 144Q167 149 174 143L191 128',PAPER)
    art+=torso(121,PAPER,a,kind='vest')+head(121,67,skin,'#75513F','wave',moustache=True,angle=-3)
    art+=hand(198,122,skin,37,'open')
    art+=g(p('M40 137Q42 132 50 132L59 134Q61 137 57 139L50 142 43 141Z',SKINS[skin][0])+p('M25 125H81L77 131H29Z',INK))
    art+=g(rect(31,104,15,20,3,PAPER)+p('M46 108H49Q55 108 53 115Q52 119 46 118',stroke=a,stroke_width=2)+rect(60,103,14,21,3,'#EAC28C')+p('M74 107H77Q83 108 81 115Q79 119 74 118',stroke=a,stroke_width=2)+p('M38 97Q33 93 38 87M67 96Q72 92 67 86',stroke=a,stroke_width=1.2),stroke=a)
    write('ESFJ','The host offering a warm welcome','A warm moustached male host in a terracotta waistcoat balances a tray with two steaming cups. His free hand opens in a relaxed gesture of welcome.',art)

def istp():
    a,s=PALETTES['ISTP'];skin=3
    art=p('M83 154 107 160 92 196 110 205 104 216H79Q68 215 73 204Z',INK)+p('M109 154 132 160 154 174Q159 178 157 186L151 207H135L137 186 111 179Z','#355954')+shoe(103,206)+shoe(136,205)
    art+=limb('M78 113Q63 136 51 167',a)+limb('M127 114 149 139Q155 143 160 134L171 115',a)
    art+=torso(103,a,'#5C9B8B',angle=6)+p('M81 131 92 129 94 140 83 142ZM115 128 126 130 125 141 114 139Z','#276355',stroke='none')
    art+=head(101,73,skin,'#33463B','cap',beard=True,angle=7)+hand(47,175,skin,25)
    art+=g(p('M-4 29V-8Q-14-13-11-24L-6-16H3L8-24Q14-13 4-8V29Q0 35-4 29Z','#82999B')+p('M0 20V-5',stroke=PAPER,stroke_width=1.2)+c(0,27,1.6,INK,stroke='none'),transform='translate(182 89) rotate(23)')
    art+=hand(171,115,skin,24)
    write('ISTP','The maker kneeling with a wrench','A bearded male maker in a green work shirt and cap kneels with a steel open-ended wrench. Rolled sleeves, two pockets and a grounded pose keep the scene practical.',art)

def isfp():
    a,s=PALETTES['ISFP'];skin=0
    art=rect(69,166,60,7,3,'#BCA383')+p('M76 174 67 213M122 174 131 213',stroke='#A88C70',stroke_width=4)
    art+=p('M81 156 105 159 100 181 84 203 69 198 85 176Z','#D9CBAE')+p('M103 154 126 159 141 175 137 203H120L124 182 104 176Z','#C8B99C')+shoe(75,201,True)+shoe(121,202)
    art+=limb('M78 109 62 134Q59 141 65 149',a)+limb('M124 112 138 136Q142 141 151 137L158 132',a)
    art+=torso(101,a,'#B498CC',kind='sweater')+head(99,69,skin,'#6B4E3D','sweep',beard=True,angle=7)
    art+=g(p('M156 212 177 82 181 82 203 212',stroke='#A78B70',stroke_width=4)+p('M163 202H196',stroke='#A78B70',stroke_width=2)+rect(161,94,47,68,2,'#B99C7D')+rect(165,98,39,59,1,PAPER,stroke='none')+c(193,111,5.5,GOLD,stroke='none')+p('M166 140 178 122 192 141 203 130V156H166Z','#A4B990',stroke='none')+p('M166 150 177 139 190 154 181 157H166Z',a,stroke='none')+p('M157 165H211',stroke='#9C8069',stroke_width=4))
    art+=g(p('M42 162Q43 147 61 147Q76 148 77 158Q78 165 69 165L62 163Q57 163 60 169Q56 175 48 171Q42 169 42 162Z','#E8D4A8')+c(50,157,3,a,stroke='none')+c(58,152,2.6,GOLD,stroke='none')+c(69,156,2.7,'#6A925E',stroke='none'))+hand(65,150,skin,15)
    art+=p('M156 136 183 125',stroke=INK,stroke_width=2)+p('M182 123Q188 120 191 123L184 128Z',a,stroke='none')+hand(158,134,skin,67)
    write('ISFP','The artist painting at an easel','A bearded male artist in a lilac sweater sits at a wooden easel. He holds a small palette and touches a brush to a quiet mountain-and-sun landscape.',art)

def estp():
    a,s=PALETTES['ESTP'];skin=2;coat='#B56B25'
    art=p('M134 214 143 195 161 190 183 195 202 214Z','#C7C5B1',stroke='none')+p('M143 195 160 198 168 207M161 190 174 201',stroke='#9C9C8C',stroke_width=1.2)
    art+=p('M86 153H110L105 203H88Z',INK)+p('M108 152 132 149Q149 149 157 160L155 179H139L137 168 114 174Z','#4D565A')+shoe(88,201,True)+shoe(140,181)
    art+=limb('M87 108Q70 127 64 148',coat)+limb('M133 108Q152 120 151 145',coat)
    art+=torso(110,coat,'#D5914B')+hand(61,155,skin,-10)+head(110,67,skin,'#403D35','short',glasses='sun',angle=-6)
    art+=p('M101 105 118 140M130 105 136 141',stroke=INK,stroke_width=2.5)
    art+=g(rect(111,138,34,24,4,INK)+rect(119,134,13,7,2,INK)+c(129,150,8,'#6D8790',stroke='none')+c(129,150,4.8,PAPER,stroke='none')+c(130,149,2.2,'#6D8790',stroke='none')+c(116,143,1.5,GOLD,stroke='none'))
    art+=hand(149,151,skin,16)+rect(144,138,15,5,2,a)+rect(149,137,6,7,2,PAPER)
    write('ESTP','The adventurer stepping onto a rock','A confident male adventurer in an ochre jacket rests one foot on a rock. Sunglasses, a wristwatch and a camera on a connected neck strap convey readiness to explore.',art)

def esfp():
    a,s=PALETTES['ESFP'];skin=3
    art=p('M96 153 119 159 109 184 84 206 72 196 96 175Z',INK)+p('M119 155 140 149 159 171 182 182 176 199 148 186 125 175Z','#4F435A')+shoe(78,202,True,color=PAPER,angle=-7)+shoe(180,186,color=PAPER,angle=58)
    art+=p('M42 111Q25 135 31 167Q35 190 64 195',stroke='#71868E',stroke_width=1.4)
    art+=limb('M91 107 70 139Q66 144 61 135L43 113',a)+limb('M136 107 157 114Q161 115 166 108L182 88',a)
    art+=torso(113,a,'#C570A0',angle=-6)+p('M91 148 110 157 96 176 80 163Z','#C570A0',stroke='none')+head(113,65,skin,'#342F38','wave',moustache=True,angle=-10)
    art+=hand(187,81,skin,34,'open')
    art+=g(rect(-4,-3,8,28,4,INK)+el('ellipse',cx=0,cy=-10,rx=8,ry=11,fill='#70838B')+p('M-5-16 6-12M-6-11 6-7M-5-6 4-3',stroke=PAPER,stroke_width=1)+rect(-2,7,4,3,1,GOLD,stroke='none'),transform='translate(39 94) rotate(-26)')
    art+=hand(45,108,skin,-26)+p('M63 209 76 208M181 198 185 205',stroke=a,stroke_width=1.4)
    write('ESFP','The performer dancing with a microphone','An expressive moustached male performer in a magenta jacket dances in light sneakers. A clearly held microphone, a loose cable and an open raised hand complete the movement.',art)

if __name__=='__main__':
    for draw in (intj, intp, entj, entp, infj, infp, enfj, enfp, istj, isfj, estj, esfj, istp, isfp, estp, esfp):
        draw()
    print(f'Rebuilt 16 SVG illustrations in {OUT}')
