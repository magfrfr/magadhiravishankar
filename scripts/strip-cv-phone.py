# The public CV is a copy of her resume served to anyone who opens the site.
# Her phone number does not belong in a public download, so it is taken off the
# contact line here, and the line is re-set centred without it.
# Re-run this after copying a fresh resume into public/.
import os
import re
import sys
import fitz

PDF = 'public/Magadhi-Ravishankar-CV.pdf'
# matched, never spelled out: this file is in a public repo
PHONE = re.compile(r'\+\d[\d ()\-]{7,}\d')

doc = fitz.open(PDF)
page = doc[0]

hit = None
for block in page.get_text('dict')['blocks']:
    for line in block.get('lines', []):
        for span in line['spans']:
            if PHONE.search(span['text']):
                hit = span
if hit is None:
    print('no phone number on the contact line; nothing to do')
    sys.exit(0)

parts = [p.strip() for p in hit['text'].split('|')]
kept = '  |  '.join(p for p in parts if not PHONE.search(p))

font_xref = next(x[0] for x in page.get_fonts() if x[3].endswith('Calibri'))
_, _, _, buf = doc.extract_font(font_xref)
open('.cv-font.ttf', 'wb').write(buf)

rect = fitz.Rect(hit['bbox']).round() + (-2, -2, 2, 2)
page.add_redact_annot(rect)
page.apply_redactions()

page.insert_font(fontname='cv', fontfile='.cv-font.ttf')
size = hit['size']
width = fitz.Font(fontfile='.cv-font.ttf').text_length(kept, fontsize=size)
page.insert_text(
    (page.rect.width / 2 - width / 2, hit['origin'][1]),
    kept, fontname='cv', fontsize=size, color=(0, 0, 0),
)

doc.save(PDF + '.tmp', garbage=4, deflate=True)
doc.close()
os.replace(PDF + '.tmp', PDF)
os.remove('.cv-font.ttf')

check = fitz.open(PDF)
text = check[0].get_text()
print('phone still present:', bool(PHONE.search(text)))
print(text.split('\n')[1])
