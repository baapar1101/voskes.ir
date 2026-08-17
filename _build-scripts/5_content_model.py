#!/usr/bin/env python3
"""
Pass 5 - the last content-model / ARIA defects, all inherited from the source.

  A. <div> inside <button> (carousel thumbnails) -> <span>; <button> only takes
     phrasing content. .ar--square gets an explicit display:block so the
     aspect-ratio box is unaffected (divs were block by default anyway).
  B. <input type=checkbox class="d--none"> inside <a> -> removed. It is hidden,
     sits outside any <form>, and product-filters.mjs only ever acts on inputs
     that have a <form> ancestor, so nothing reads it.
  C. <button> without type -> type="button" (default is submit).
  D. aria-label on decorative <i> icons -> aria-hidden="true"; the parent
     <button> already carries the real label.
  E. <p> wrapping a <table> -> unwrapped.
"""
import os, re, glob, json, collections

DST = '/home/claude/build/voskes.nl'
stats = collections.Counter()

# NB: data-glide-dir=">" puts a literal > inside an attribute value, so every
# tag pattern here must skip over quoted regions rather than stop at the first >.
TAGBODY = r'(?:"[^"]*"|[^>"])*'
BUTTON_RE = re.compile(r'(<button\b' + TAGBODY + r'>)(.*?)(</button>)', re.S)

def fix_buttons(html):
    def r(m):
        inner = m.group(2)
        new, n1 = re.subn(r'<div\b', '<span', inner)
        new, n2 = re.subn(r'</div>', '</span>', new)
        if n1:
            stats['button_divs_to_spans'] += n1
        return m.group(1) + new + m.group(3)
    return BUTTON_RE.sub(r, html)

ANCHOR_INPUT = re.compile(r'(<a\b(?:"[^"]*"|[^>"])*class="[^"]*filters__item[^"]*"'
                          r'(?:"[^"]*"|[^>"])*>)\s*'
                          r'<input\b(?:"[^"]*"|[^>"])*class="[^"]*d--none[^"]*"'
                          r'(?:"[^"]*"|[^>"])*>\s*')

def fix_anchor_inputs(html):
    html, n = ANCHOR_INPUT.subn(r'\1 ', html)
    stats['hidden_inputs_removed'] += n
    return html

def fix_button_type(html):
    def r(m):
        tag = m.group(0)
        if re.search(r'\stype\s*=', tag):
            return tag
        stats['button_type_added'] += 1
        return tag[:-1].rstrip() + ' type="button">'
    return re.sub(r'<button\b' + TAGBODY + r'>', r, html)

ICON_LABEL = re.compile(r'(<i\b(?:"[^"]*"|[^>"])*?)\saria-label="[^"]*"')

def fix_icon_labels(html):
    html, n = ICON_LABEL.subn(r'\1 aria-hidden="true"', html)
    stats['icon_labels_to_hidden'] += n
    return html

P_TABLE = re.compile(r'<p>\s*(<table\b.*?</table>)\s*</p>', re.S)

def fix_p_table(html):
    html, n = P_TABLE.subn(r'\1', html)
    stats['p_around_table_removed'] += n
    return html

def main():
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        out = fix_p_table(fix_icon_labels(fix_button_type(
            fix_anchor_inputs(fix_buttons(s)))))
        if out != s:
            open(rel, 'w', encoding='utf8').write(out)
            stats['files_changed'] += 1

    css_path = 'css/style.min.css'
    css = open(css_path, encoding='utf8').read()
    css, n = re.subn(r'\.ar--square\{position:relative\}',
                     '.ar--square{position:relative;display:block}', css)
    stats['css_ar_square_display'] = n
    open(css_path, 'w', encoding='utf8').write(css)
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
