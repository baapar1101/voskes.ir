#!/usr/bin/env python3
"""
Pass 0 - runs on the ORIGINAL source, before any other pass.

Two source defects corrupt the attribute region of a tag, which means every
later pass parses that tag wrongly and can swallow following elements:

  1. missing whitespace between attributes:  class="x"aria-label="y"
  2. an unescaped " inside an attribute value (product names use the inch
     mark):  alt="KNOTTED BONE 6-7" (15-18CM) - 1PC | ..."

(2) is repaired by treating the real closing quote as the one immediately
before the tag's `>` and escaping every interior quote as &quot;.
"""
import re, os, glob, shutil, json, collections

SRC = '/home/claude/repo'
FIXED = '/home/claude/src-fixed'
stats = collections.Counter()

# 1 -------------------------------------------------- missing space
MISSING_SPACE = re.compile(r'(="[^"<>]*")(?=[A-Za-z_:][-\w:.]*\s*=)')

# 2 -------------------------------------------------- stray inner quote
TAG_SCAN = re.compile(r'<[a-zA-Z][-\w]*')
ATTR_OK = re.compile(r'\s*([A-Za-z_:][-\w:.]*)(\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')

def fix_tag_quotes(html):
    out, i, n = [], 0, len(html)
    while True:
        m = TAG_SCAN.search(html, i)
        if not m:
            out.append(html[i:]); break
        out.append(html[i:m.end()])
        p = m.end()
        # walk the attribute region
        parts = []
        broken = False
        while p < n and html[p] != '>':
            am = ATTR_OK.match(html, p)
            if not am or am.end() == p:
                broken = True; break
            if am.group(2) is None and not re.match(r'\s*[/>]', html[am.end():am.end()+2] or '>'):
                # bare token: legal only for boolean attrs; treat as a signal
                pass
            parts.append(am.group(0))
            p = am.end()
            if p < n and html[p] == '/':
                parts.append('/'); p += 1
        if broken or p >= n:
            # find the tag's real end: the last quote before the closing '>'
            close = html.find('>', m.end())
            if close == -1:
                out.append(html[m.end():]); break
            region = html[m.end():close]
            fixed = repair_region(region)
            out.append(fixed + '>')
            i = close + 1
            continue
        out.append(html[m.end():p])
        i = p
    return ''.join(out)

ATTR_FULL = re.compile(r'\s*([A-Za-z_:][-\w:.]*)\s*=\s*"(.*)"$', re.S)

def repair_region(region):
    """
    Walk the attribute region. When the walk gets stuck on a bare token, the
    attribute just before it is the one whose value was cut short by an
    unescaped quote - extend it to the last quote in the region and escape
    every quote inside.
    """
    res, p, n = [], 0, len(region)
    prev = None          # (start_offset, res_index) of the last quoted attribute
    while p < n:
        am = ATTR_OK.match(region, p)
        if am and am.end() > p:
            if am.group(3) and am.group(3)[0] == '"':
                prev = (p, len(res))
            res.append(am.group(0))
            p = am.end()
            if p < n and region[p] == '/':
                res.append('/'); p += 1
            continue
        if prev is not None:
            start, idx = prev
            last = region.rfind('"')
            if last > p:
                nm = ATTR_FULL.match(region[start:last + 1])
                if nm and '"' in nm.group(2):
                    del res[idx:]
                    res.append(' {}="{}"'.format(nm.group(1),
                                                 nm.group(2).replace('"', '&quot;')))
                    stats['stray_quotes_escaped'] += 1
                    p = last + 1
                    prev = None
                    continue
        res.append(region[p]); p += 1
    return ''.join(res)

def main():
    if os.path.exists(FIXED):
        shutil.rmtree(FIXED)
    shutil.copytree(SRC, FIXED, ignore=shutil.ignore_patterns('.git'))
    os.chdir(FIXED)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8', errors='ignore').read()
        s, n = MISSING_SPACE.subn(r'\1 ', s)
        stats['missing_space_fixed'] += n
        s = fix_tag_quotes(s)
        open(rel, 'w', encoding='utf8').write(s)
        stats['files'] += 1
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
