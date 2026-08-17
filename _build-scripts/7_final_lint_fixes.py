#!/usr/bin/env python3
"""
Pass 7 - the last few lint findings.

  A. honeypot inputs inside <div class="nopot" aria-hidden="true"> get
     tabindex="-1", so they are not focusable - which matches the aria state
     and makes the spam trap work better.
  B. <h4><br></h4> leftovers from the WYSIWYG are removed.
  C. aria-label on the contact <select> duplicated its own <label>; dropped.
"""
import re, os, glob, json, collections

DST = '/home/claude/build/voskes.nl'
stats = collections.Counter()
TB = r'(?:"[^"]*"|[^>"])*'

def main():
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        o = s

        def hp(m):
            def add(x):
                if 'tabindex' in x.group(1):
                    return x.group(0)
                stats['honeypot_tabindex'] += 1
                return x.group(1) + ' tabindex="-1"' + x.group(2)
            return re.sub(r'(<input' + TB + r')(/?>)', add, m.group(0))

        o = re.sub(r'<div class="nopot" aria-hidden="true">.*?</div>', hp, o, flags=re.S)
        o, n = re.subn(r'<h([1-6])>\s*(?:<br\s*/?>)+\s*</h\1>', '', o)
        stats['empty_headings_removed'] += n
        o, n = re.subn(r'(<select' + TB + r'id="form1_field4")\s+aria-label="[^"]*"', r'\1', o)
        stats['redundant_aria_label'] += n

        if o != s:
            open(rel, 'w', encoding='utf8').write(o)
            stats['files'] += 1
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
