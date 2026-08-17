#!/usr/bin/env python3
"""
Pass 6 - last set, all genuine defects in the captured source.

  A. <span role="button"> in the nav becomes a real <button type="button">.
     The spans had no tabindex, so keyboard users could not open a submenu at
     all. A reset is added to .main-nav__toggle-submenu so the native button
     chrome (border/background/font/padding) does not change the look.
  B. the static aria-hidden="true" on collapsed submenus is dropped. Pass 3
     gave them visibility:hidden, which already removes them from both the
     accessibility tree and the tab order, and wiamenuitem.mjs still sets the
     attribute dynamically when a menu opens or closes.
  C. autocomplete="false" -> "off" (false is not a valid token).
  D. <input type="password"> gets autocomplete="current-password".
  E. <img title="tip"> with no alt -> alt="" and title dropped (decorative).
  F. <h3> containing only that image -> the image is moved out of the heading.
"""
import os, re, glob, json, collections

DST = '/home/claude/build/voskes.nl'
stats = collections.Counter()
TAGBODY = r'(?:"[^"]*"|[^>"])*'

SPAN_BTN = re.compile(r'<span(' + TAGBODY + r'role="button"' + TAGBODY + r')>(.*?)</span>', re.S)

def span_to_button(html):
    def r(m):
        attrs = m.group(1).replace('role="button"', 'type="button"')
        stats['span_role_button_to_button'] += 1
        return f'<button{attrs}>{m.group(2)}</button>'
    return SPAN_BTN.sub(r, html)

def drop_static_aria_hidden(html):
    def r(m):
        stats['static_aria_hidden_dropped'] += 1
        return m.group(0).replace(' aria-hidden="true"', '')
    return re.sub(r'<ul' + TAGBODY + r'class="[^"]*main-nav__submenu[^"]*"' + TAGBODY + r'>',
                  r, html)

def misc(html):
    html, n = re.subn(r'autocomplete="false"', 'autocomplete="off"', html)
    stats['autocomplete_false_fixed'] += n
    def pw(m):
        if 'autocomplete=' in m.group(0):
            return m.group(0)
        stats['password_autocomplete_added'] += 1
        return m.group(0)[:-1].rstrip().rstrip('/') + ' autocomplete="current-password"/>'
    html = re.sub(r'<input' + TAGBODY + r'type="password"' + TAGBODY + r'/?>', pw, html)
    # decorative tip image sitting alone inside a heading
    def tip(m):
        stats['tip_image_unwrapped'] += 1
        img = m.group(1).replace(' title="tip"', '')
        if 'alt=' not in img:
            img = img[:-1].rstrip().rstrip('/') + ' alt=""/>'
        return img
    html = re.sub(r'<h3>\s*(<img' + TAGBODY + r'/?>)\s*</h3>', tip, html)
    return html

CSS_RESET = ('.main-nav__toggle-submenu{align-items:center;aspect-ratio:1/1;'
             'display:inline-flex;height:100%;justify-content:center;margin-left:10px;'
             'min-width:40px;position:relative;'
             'border:0;background:transparent;padding:0;font:inherit;color:inherit;cursor:pointer}')

def main():
    os.chdir(DST)
    for rel in sorted(glob.glob('**/*.html', recursive=True)):
        s = open(rel, encoding='utf8').read()
        out = misc(drop_static_aria_hidden(span_to_button(s)))
        if out != s:
            open(rel, 'w', encoding='utf8').write(out); stats['files_changed'] += 1
    p = 'css/style.min.css'
    css = open(p, encoding='utf8').read()
    old = ('.main-nav__toggle-submenu{align-items:center;aspect-ratio:1/1;display:inline-flex;'
           'height:100%;justify-content:center;margin-left:10px;min-width:40px;position:relative}')
    css, n = css.replace(old, CSS_RESET), css.count(old)
    stats['css_button_reset'] = n
    open(p, 'w', encoding='utf8').write(css)
    print(json.dumps(dict(stats), indent=2))

if __name__ == '__main__':
    main()
