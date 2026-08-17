#!/usr/bin/env python3
"""
Pass 2 - repair markup defects that were already present in the captured source.

  1. unclosed empty <a> in the cookie banner (breaks the document tree on 213 pages)
  2. missing whitespace between attributes
  3. single-quoted attribute values
  4. duplicate attributes on one element
  5. <img srcset=...> with no src
  6. id values starting with a digit
  7. bare & not part of a character reference
  8. lowercase doctype
"""
import os, re, glob, json, collections

DST = '/home/claude/build/voskes.nl'
stats = collections.Counter()

# 1 --------------------------------------------------------- empty anchor fix
# the captured HTML opens an <a> for the cookie statement, never fills or closes
# it, so every following element parses as a child of that <a>.
LINK_TEXT = {'en': 'cookie statement', 'nl': 'cookieverklaring',
             'de': 'Cookie-Erklärung', 'fr': 'déclaration relative aux cookies'}
EMPTY_A = re.compile(r'(<a href="[^"]*")(\s[^>]*)?>(?=\s*[.,])')

def fix_empty_anchor(html, lang):
    def r(m):
        stats['empty_anchor_closed'] += 1
        return f'{m.group(1)}{m.group(2) or ""}>{LINK_TEXT.get(lang, LINK_TEXT["en"])}</a>'
    return EMPTY_A.sub(r, html)

# 2-6 ------------------------------------------------------- per-tag cleanups
TAG_RE = re.compile(r'<([a-zA-Z][-\w]*)((?:"[^"]*"|\'[^\']*\'|[^>"\'])*?)(/?)>')
ATTR_RE = re.compile(r'([A-Za-z_:][-\w:.]*)\s*(?:=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')

def clean_tag(m):
    name, body, selfclose = m.group(1), m.group(2), m.group(3)
    if not body.strip():
        return m.group(0)
    attrs, seen = [], set()
    for am in ATTR_RE.finditer(body):
        key, raw = am.group(1).lower(), am.group(2)
        if key in seen:
            stats['duplicate_attr_removed'] += 1
            continue
        seen.add(key)
        if raw is None:
            attrs.append((key, None)); continue
        if raw[0] == "'":
            stats['single_quotes_fixed'] += 1
            val = raw[1:-1]
        elif raw[0] == '"':
            val = raw[1:-1]
        else:
            stats['unquoted_attr_fixed'] += 1
            val = raw
        attrs.append((key, val))
    d = dict(attrs)
    # <img srcset> with no src -> use the first (smallest) srcset candidate
    if name.lower() == 'img' and 'srcset' in d and 'src' not in d:
        first = d['srcset'].split(',')[0].strip().split()[0]
        attrs.insert(0, ('src', first))
        stats['img_src_added'] += 1
    out = []
    for key, val in attrs:
        if val is None:
            out.append(key); continue
        if key == 'id' and val and not val[0].isalpha():
            val = 'id-' + val
            stats['numeric_id_prefixed'] += 1
        out.append(f'{key}="{encode_amp(val)}"')
    joined = (' ' + ' '.join(out)) if out else ''
    if len(out) != len(re.findall(r'\S+', body)):
        stats['attr_spacing_fixed'] += 1
    return f'<{name}{joined}{"/" if selfclose else ""}>'

# 7 ------------------------------------------------------------ bare & in text
BARE_AMP = re.compile(r'&(?![a-zA-Z][a-zA-Z0-9]{1,8};|#\d{1,6};|#[xX][0-9a-fA-F]{1,6};)')

def encode_amp(s):
    s2, n = BARE_AMP.subn('&amp;', s)
    stats['bare_amp_encoded'] += n
    return s2

RAW_TEXT = re.compile(r'<(script|style)\b(?:"[^"]*"|[^>"])*>.*?</\1\s*>', re.S | re.I)

def process(html, lang):
    html = fix_empty_anchor(html, lang)
    # protect <script>/<style> bodies: & is legal raw text there
    holds = []
    def stash(m):
        holds.append(m.group(0))
        return f'\x00{len(holds)-1}\x00'
    html = RAW_TEXT.sub(stash, html)

    # walk tags and text separately
    out, pos = [], 0
    for m in TAG_RE.finditer(html):
        out.append(encode_amp(html[pos:m.start()]))
        out.append(clean_tag(m))
        pos = m.end()
    out.append(encode_amp(html[pos:]))
    html = ''.join(out)

    html = re.sub(r'\x00(\d+)\x00', lambda m: holds[int(m.group(1))], html)
    html = re.sub(r'^<!doctype html>', '<!DOCTYPE html>', html, flags=re.I)
    return html

def lang_of(rel):
    if rel.startswith('en/') or rel == 'en.html': return 'en'
    if rel.startswith('de') : return 'de'
    if rel.startswith('fr') : return 'fr'
    return 'nl'

def main():
    os.chdir(DST)
    files = sorted(glob.glob('**/*.html', recursive=True))
    for i, rel in enumerate(files, 1):
        s = open(rel, encoding='utf8').read()
        open(rel, 'w', encoding='utf8').write(process(s, lang_of(rel)))
        if i % 50 == 0:
            print(f'  ... {i}/{len(files)}')
    stats['files'] = len(files)
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
