#!/usr/bin/env python3
"""
Pass 4 - the last non-standard attributes.

j-id, san-id, js-slide and j-display are invented attribute names on ordinary
elements. They become data-*, and every JS selector that queries them is
rewritten in the same pass so behaviour is unchanged.
"""
import os, re, glob, json, collections

DST = '/home/claude/build/voskes.nl'
RENAME = ['j-id', 'san-id', 'js-slide', 'j-display']
stats = collections.Counter()

TAG_RE = re.compile(r'<[a-zA-Z][-\w]*(?:"[^"]*"|[^>"])*>')

def fix_html(html):
    def per_tag(m):
        t = m.group(0)
        for a in RENAME:
            t, n = re.subn(r'(?<=[\s"])' + a + r'(?=[\s=/>])', 'data-' + a, t)
            stats['attr_' + a] += n
        # js-slide is a valueless attribute; give it an explicit empty value
        t = re.sub(r'(?<=[\s"])data-js-slide(?=[\s/>])', 'data-js-slide=""', t)
        return t
    return TAG_RE.sub(per_tag, html)

def fix_js(src):
    for a in RENAME:
        src, n = re.subn(r'\[' + a + r'([=\]])', '[data-' + a + r'\1', src)
        stats['js_selector_' + a] += n
        src, n = re.subn(r'(getAttribute|setAttribute|removeAttribute|hasAttribute)\((["\'])'
                         + a + r'\2', r'\1(\2data-' + a + r'\2', src)
        stats['js_attrapi_' + a] += n
    return src

def main():
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        out = fix_html(s)
        if out != s:
            open(rel, 'w', encoding='utf8').write(out); stats['html_files'] += 1
    for rel in sorted(glob.glob('js/**/*.*', recursive=True)):
        if not rel.endswith(('.js', '.mjs')):
            continue
        s = open(rel, encoding='utf8').read()
        out = fix_js(s)
        if out != s:
            open(rel, 'w', encoding='utf8').write(out); stats['js_files'] += 1
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
