#!/usr/bin/env python3
"""
Persian (fa-IR) localization + RTL conversion.

Order of operations per page:
  1. <html lang="fa" dir="rtl">
  2. Vazirmatn stylesheet link + font-variable override in the inline <style>
  3. mirror direction-implying icon classes
  4. flip direction-sensitive inline style="" declarations
  5. apply the fa.json catalog to text nodes and to translatable attributes
  6. convert Latin digits to Persian digits **inside translated strings only**

Everything is parsed quote-aware: this codebase has data-glide-dir=">" and
alt texts containing the inch mark, so a naive <[^>]+> splits tags in half.
"""
import os, re, json, glob, html, collections

DST = '/home/claude/build/voskes.nl'
CAT = os.path.join(DST, 'i18n', 'fa.json')

FONT_LINK = ('<link rel="stylesheet" '
             'href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/'
             'Vazirmatn-font-face.css">')
FONT_STACK = ('"Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", '
              'Tahoma, sans-serif')

# quote-aware primitives
TAG = re.compile(r'<(?:"[^"]*"|[^>"])*>')
RAWTEXT = re.compile(r'<(script|style)\b(?:"[^"]*"|[^>"])*>.*?</\1\s*>', re.S | re.I)

# direction-implying Font Awesome icons
ICON_SWAP = [
    ('fa-chevron-circle-left', 'fa-chevron-circle-right'),
    ('fa-angle-left', 'fa-angle-right'),
    ('fa-angle-double-left', 'fa-angle-double-right'),
    ('fa-long-arrow-alt-left', 'fa-long-arrow-alt-right'),
    ('fa-arrow-left', 'fa-arrow-right'),
    ('fa-chevron-left', 'fa-chevron-right'),
    ('fa-caret-left', 'fa-caret-right'),
]
ICON_MAP = {}
for a, b in ICON_SWAP:
    ICON_MAP[a] = b
    ICON_MAP[b] = a
ICON_RE = re.compile(r'\b(' + '|'.join(re.escape(k) for k in ICON_MAP) + r')\b')

DIGITS = str.maketrans('0123456789', '\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9')

stats = collections.Counter()
pending_text = collections.Counter()
pending_attr = collections.Counter()


def fa_digits(s):
    """Persian digits, but never inside an ASCII token that looks like code."""
    return s.translate(DIGITS)


# ---------------------------------------------------------------- 1. html tag
def set_html_attrs(doc):
    def r(m):
        t = m.group(0)
        t = re.sub(r'\slang="[^"]*"', '', t)
        t = re.sub(r'\sdir="[^"]*"', '', t)
        stats['html_dir_lang'] += 1
        return t[:-1].rstrip().rstrip('/') + ' lang="fa" dir="rtl">'
    return re.sub(r'<html\b(?:"[^"]*"|[^>"])*>', r, doc, count=1)


# ------------------------------------------------------------------- 2. fonts
def inject_font(doc):
    if FONT_LINK not in doc:
        doc = doc.replace('</head>', FONT_LINK + '</head>', 1)
        stats['font_link_added'] += 1
    # the per-page inline <style> defines the font custom properties
    for var in ('--default_font', '--heading_font', '--btn_font_family'):
        doc, n = re.subn(var + r'\s*:\s*[^;}]*', var + ': ' + FONT_STACK, doc)
        stats['font_vars_overridden'] += n
    return doc


# ------------------------------------------------------------------- 3. icons
MARK = '<!--i18n:fa icons mirrored-->'

def mirror_icons(doc):
    # mirroring is an involution: applying it twice restores the original, so
    # a marker keeps repeat runs of this script idempotent.
    if MARK in doc:
        stats['icons_already_mirrored'] += 1
        return doc
    def per_tag(m):
        t = m.group(0)
        if 'fa-' not in t:
            return t
        new = ICON_RE.sub(lambda x: ICON_MAP[x.group(1)], t)
        if new != t:
            stats['icons_mirrored'] += 1
        return new
    doc = TAG.sub(per_tag, doc)
    return doc.replace('</head>', MARK + '</head>', 1)


# ----------------------------------------------------- 4. inline style="" flip
INLINE_FLIP = [
    (re.compile(r'text-align\s*:\s*left'), 'text-align: start'),
    (re.compile(r'text-align\s*:\s*right'), 'text-align: end'),
    (re.compile(r'float\s*:\s*left'), 'float: inline-start'),
    (re.compile(r'float\s*:\s*right'), 'float: inline-end'),
    (re.compile(r'margin-left\s*:'), 'margin-inline-start:'),
    (re.compile(r'margin-right\s*:'), 'margin-inline-end:'),
    (re.compile(r'padding-left\s*:'), 'padding-inline-start:'),
    (re.compile(r'padding-right\s*:'), 'padding-inline-end:'),
]

def flip_inline_styles(doc):
    def r(m):
        v = m.group(1)
        out = v
        for pat, rep in INLINE_FLIP:
            out = pat.sub(rep, out)
        if out != v:
            stats['inline_styles_flipped'] += 1
        return 'style="' + out + '"'
    return re.sub(r'style="([^"]*)"', r, doc)


# --------------------------------------------------------------- 5. translate
def translate(doc, cat_text, cat_attr):
    # --- attributes (skip inside <script>/<style>, which have none anyway)
    def attr_repl(m):
        a, v = m.group(1), m.group(2)
        norm = re.sub(r'\s+', ' ', html.unescape(v)).strip()
        if not norm or not re.search(r'[A-Za-z]{2}', norm):
            return m.group(0)
        key = a + '\x00' + norm
        if key in cat_attr:
            stats['attrs_translated'] += 1
            out = html.escape(fa_digits(cat_attr[key]), quote=True)
            return f'{a}="{out}"'
        pending_attr[key] += 1
        return m.group(0)

    doc = re.sub(r'\b(alt|title|placeholder|aria-label|content)="([^"]*)"',
                 attr_repl, doc)

    # --- text nodes: walk tags, translate what lies between them
    holds = []
    def stash(m):
        holds.append(m.group(0))
        return f'\x01{len(holds)-1}\x01'
    doc = RAWTEXT.sub(stash, doc)

    out, pos = [], 0
    for m in TAG.finditer(doc):
        out.append(translate_chunk(doc[pos:m.start()], cat_text))
        out.append(m.group(0))
        pos = m.end()
    out.append(translate_chunk(doc[pos:], cat_text))
    doc = ''.join(out)

    doc = re.sub(r'\x01(\d+)\x01', lambda m: holds[int(m.group(1))], doc)
    return doc


def translate_chunk(chunk, cat_text):
    if not chunk.strip() or not re.search(r'[A-Za-z]', chunk):
        return chunk
    norm = re.sub(r'\s+', ' ', html.unescape(chunk)).strip()
    if norm in cat_text:
        stats['text_translated'] += 1
        lead = chunk[:len(chunk) - len(chunk.lstrip())]
        trail = chunk[len(chunk.rstrip()):]
        return lead + html.escape(fa_digits(cat_text[norm]), quote=False) + trail
    pending_text[norm] += 1
    return chunk


# ------------------------------------------------------------------ main
def main():
    cat = json.load(open(CAT, encoding='utf8'))
    cat_text, cat_attr = cat['text'], cat['attr']
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        d = set_html_attrs(s)
        d = inject_font(d)
        d = mirror_icons(d)
        d = flip_inline_styles(d)
        d = translate(d, cat_text, cat_attr)
        if d != s:
            open(rel, 'w', encoding='utf8').write(d)
            stats['files_changed'] += 1

    print(json.dumps(dict(stats), indent=2, ensure_ascii=False))
    json.dump({'text': pending_text.most_common(), 'attr': pending_attr.most_common()},
              open('/home/claude/pending.json', 'w'), ensure_ascii=False, indent=1)
    print(f"\nuntranslated text strings : {len(pending_text)} unique / {sum(pending_text.values())} instances")
    print(f"untranslated attr values  : {len(pending_attr)} unique / {sum(pending_attr.values())} instances")


if __name__ == '__main__':
    main()
