#!/usr/bin/env python3
"""
voskes.nl -> standard static HTML

- extracts the 885 KB inlined logo data-URI (648 copies) to one assets/images/logo.svg
- converts <san-container>/<san-col>/<j-card>/<j-content> to <div> with data-* attributes
- rewrites css/style.min.css selectors to match
- rewrites extensionless internal links to root-absolute .html
- strips Google Tag Manager
- removes duplicate CSS, fixes favicon, drops empty <link href="">
"""
import os, re, shutil, sys, json, collections

SRC = '/home/claude/src-fixed'
DST = '/home/claude/build/voskes.nl'
LOGO_SVG = '/home/claude/logo_p1.svg'

TAGS = ('san-container', 'san-col', 'j-card', 'j-content')
# non-standard attributes seen on those tags -> become data-*
NONSTD_ATTRS = {'span', 'options', 'no-gap', 'order', 'offset', 's-display',
                'type', 'block', 'centered', 'justify', 'no-border',
                'no-padding', 'j-id', 'blogs-overview-container'}
KEEP_ATTRS = {'class', 'style', 'id', 'title', 'role'}

stats = collections.Counter()

# ---------------------------------------------------------------- scaffolding
def build_tree():
    if os.path.exists(DST):
        shutil.rmtree(DST)
    shutil.copytree(SRC, DST, ignore=shutil.ignore_patterns('.git'))
    # duplicate stylesheet (byte-identical to style.min.css)
    dup = os.path.join(DST, 'css', 'style.min (1).css')
    if os.path.exists(dup):
        os.remove(dup); stats['removed_duplicate_css'] += 1
    # root en.html is byte-identical to en/index.html
    root_en = os.path.join(DST, 'en.html')
    if os.path.exists(root_en):
        os.remove(root_en); stats['removed_duplicate_page'] += 1
    # the site root is the Dutch homepage
    nl = os.path.join(DST, 'nl.html')
    if os.path.exists(nl):
        os.rename(nl, os.path.join(DST, 'index.html')); stats['nl_html_to_index'] += 1
    shutil.copy(LOGO_SVG, os.path.join(DST, 'assets', 'images', 'logo.svg'))
    shutil.copy('/home/claude/favicon.png', os.path.join(DST, 'assets', 'images', 'favicon.png'))
    stats['favicon_generated'] += 1

def page_set():
    """every path that exists on disk, relative to DST, for link resolution"""
    out = set()
    for root, _, files in os.walk(DST):
        for f in files:
            out.add(os.path.relpath(os.path.join(root, f), DST).replace(os.sep, '/'))
    return out

# ------------------------------------------------------------------ HTML pass
ATTR_RE = re.compile(r'([A-Za-z_:][-\w:.]*)(?:\s*=\s*"([^"]*)")?')

def convert_tags(html):
    out, pos = [], 0
    open_re = re.compile(r'<(' + '|'.join(TAGS) + r')(\s[^>]*)?>')
    for m in open_re.finditer(html):
        out.append(html[pos:m.start()]); pos = m.end()
        tag, rest = m.group(1), m.group(2) or ''
        classes, others = [tag], []
        for name, val in ATTR_RE.findall(rest):
            low = name.lower()
            if low == 'class':
                classes.extend(val.split())
            elif low in KEEP_ATTRS or low.startswith(('data-', 'aria-')):
                others.append(f'{low}="{val}"' if val is not None else low)
            elif low in NONSTD_ATTRS:
                others.append(f'data-{low}="{val}"')
            else:
                others.append(f'data-{low}="{val}"')
        attrs = ' class="' + ' '.join(classes) + '"'
        if others:
            attrs += ' ' + ' '.join(others)
        out.append(f'<div{attrs}>')
        stats['tags_converted'] += 1
    out.append(html[pos:])
    html = ''.join(out)
    for tag in TAGS:
        html, n = re.subn(f'</{tag}>', '</div>', html)
        stats['close_tags_converted'] += n
    return html

DATA_URI_RE = re.compile(r'data:image/svg\+xml;utf8,[^"]*')
GTM_HEAD_RE = re.compile(r'<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->', re.S)
GTM_BODY_RE = re.compile(r'<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->', re.S)

def fix_links(html, existing, depth_unused=None):
    def repl(m):
        attr, url = m.group(1), m.group(2)
        raw = url.strip()
        if not raw:
            return m.group(0)
        if raw.startswith(('http:', 'https:', '//', 'data:', 'mailto:', 'tel:', '#', 'javascript:')):
            return f'{attr}="{raw}"' if raw != url else m.group(0)
        if not raw.startswith('/'):
            return m.group(0)
        base = raw.split('?')[0].split('#')[0]
        tail = raw[len(base):]
        rel = base.lstrip('/')
        if base in ('/', '/nl'):
            stats['links_root_to_index'] += 1
            return f'{attr}="/index.html{tail}"'
        if rel in existing:
            return f'{attr}="{base}{tail}"' if raw != url else m.group(0)
        # /en -> /en/index.html (directory homepage) preferred over /en.html
        if rel + '/index.html' in existing:
            stats['links_extensionless_fixed'] += 1
            return f'{attr}="/{rel}/index.html{tail}"'
        if rel + '.html' in existing:
            stats['links_extensionless_fixed'] += 1
            return f'{attr}="/{rel}.html{tail}"'
        stats['links_still_broken'] += 1
        BROKEN[rel] += 1
        return f'{attr}="{base}{tail}"' if raw != url else m.group(0)
    return re.sub(r'\b(href|src)="([^"]*)"', repl, html)

BROKEN = collections.Counter()

def convert_html(path, existing):
    html = open(path, encoding='utf8', errors='ignore').read()
    html, n = DATA_URI_RE.subn('/assets/images/logo.svg', html)
    stats['logo_uris_replaced'] += n
    html, n = GTM_HEAD_RE.subn('', html); stats['gtm_head_removed'] += n
    html, n = GTM_BODY_RE.subn('', html); stats['gtm_body_removed'] += n
    html, n = re.subn(r'<link href="" rel="stylesheet">', '', html)
    stats['empty_link_removed'] += n
    html = convert_tags(html)
    html = fix_links(html, existing)
    open(path, 'w', encoding='utf8').write(html)

# ------------------------------------------------------------------- CSS pass
TAG_TOKEN_RE = {t: re.compile(r'(?<![.\w-])' + t + r'(?![\w-])') for t in TAGS}
ATTR_SEL_RE = re.compile(r'\[([-\w]+)([~^*$|]?=)?')

def rewrite_selector(sel):
    if not any(t in sel for t in TAGS):
        return sel
    for t in TAGS:
        sel = TAG_TOKEN_RE[t].sub('.' + t, sel)
    def a(m):
        name = m.group(1)
        if name in NONSTD_ATTRS:
            stats['css_attrs_rewritten'] += 1
            return '[data-' + name + (m.group(2) or '')
        return m.group(0)
    return ATTR_SEL_RE.sub(a, sel)

def convert_css(path):
    css = open(path, encoding='utf8').read()
    out, buf = [], []
    for ch in css:
        if ch == '{':
            sel = ''.join(buf); buf = []
            if sel.lstrip().startswith('@'):
                out.append(sel)
            else:
                new = rewrite_selector(sel)
                if new != sel:
                    stats['css_rules_rewritten'] += 1
                out.append(new)
            out.append('{')
        elif ch == '}':
            out.append(''.join(buf)); buf = []; out.append('}')
        else:
            buf.append(ch)
    out.append(''.join(buf))
    open(path, 'w', encoding='utf8').write(''.join(out))

# ----------------------------------------------------------------------- main
def main():
    build_tree()
    convert_css(os.path.join(DST, 'css', 'style.min.css'))
    existing = page_set()
    pages = sorted(p for p in existing if p.endswith('.html'))
    for i, rel in enumerate(pages, 1):
        convert_html(os.path.join(DST, rel), existing)
        if i % 50 == 0:
            print(f'  ... {i}/{len(pages)}', file=sys.stderr)
    stats['pages_converted'] = len(pages)
    print(json.dumps(dict(stats), indent=2))
    print('\n--- still-broken internal refs (top 25) ---')
    for p, c in BROKEN.most_common(25):
        print(f'{c:6} /{p}')
    print(f'\nunique broken: {len(BROKEN)}  total refs: {sum(BROKEN.values())}')

if __name__ == '__main__':
    main()
