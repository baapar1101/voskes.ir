#!/usr/bin/env python3
"""
Pass 3 - two remaining spec/a11y defects from the source.

  A. <summary> may only contain phrasing content; the language switcher put two
     <div>s in there. Both have an explicit `display` in the stylesheet, so
     swapping them for <span> is visually inert.
  B. collapsed submenus are hidden with height:0/opacity:0 but stay in the tab
     order while carrying aria-hidden="true". Adding visibility:hidden takes
     them out of the tab order so the ARIA state matches reality.
"""
import os, re, glob, json, collections

DST = '/home/claude/build/voskes.nl'
stats = collections.Counter()

SUMMARY_RE = re.compile(r'(<summary\b[^>]*>)(.*?)(</summary>)', re.S)

def fix_summary(html):
    def r(m):
        inner = m.group(2)
        new, n1 = re.subn(r'<div\b', '<span', inner)
        new, n2 = re.subn(r'</div>', '</span>', new)
        if n1 or n2:
            stats['summary_divs_to_spans'] += n1
        return m.group(1) + new + m.group(3)
    return SUMMARY_RE.sub(r, html)

def main():
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        out = fix_summary(s)
        if out != s:
            open(rel, 'w', encoding='utf8').write(out)
            stats['files_changed'] += 1

    css_path = 'css/style.min.css'
    css = open(css_path, encoding='utf8').read()
    css, n = re.subn(r'(\.main-nav__submenu\{[^{}]*?)opacity:0;',
                     r'\1opacity:0;visibility:hidden;', css)
    stats['css_visibility_hidden'] = n
    css, n = re.subn(r'(\.main-nav__submenu\.open\{[^{}]*?)opacity:1',
                     r'\1opacity:1;visibility:visible', css)
    stats['css_visibility_visible'] = n
    open(css_path, 'w', encoding='utf8').write(css)
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
