# voskes.nl — standard static HTML

Converted from the captured mirror at `github.com/baapar1101/voskes.nl` (branch `main`).

Serve the folder with any static web server, e.g.:

```bash
python3 -m http.server 8000
```

Links are **root-absolute with `.html` extensions**, so the site needs to be served
from the folder root. It will not work correctly by double-clicking a file
(`file://`), because `/css/style.min.css` resolves against the filesystem root.

---

## Result

|                        | before   | after  |
| ---------------------- | -------- | ------ |
| total size             | 582 MB   | 32 MB  |
| HTML only              | 581.6 MB | ~9 MB  |
| validation errors/page | 157      | ~2     |
| non-standard tags      | 8,342    | 0      |
| non-standard attrs     | 3,170    | 0      |

Visible text was checked against the source across a 13-page sample:
99.5–100 % retained. Output pages are 2–3 words longer — that is the cookie
link text noted under *Copy you should review*, not drift.

---

## What changed

### Size

The Holland Diervoeders logo was inlined as an 885 KB URL-encoded
`data:image/svg+xml` URI, three times per page, 645 copies in total — 98.6 % of
all HTML in the repo, and only **one** unique image among them. It now lives
once at `assets/images/logo.svg`, optimised with SVGO from 771 KB to 219 KB
(compared against the original render at 800 px: visually identical).

### Markup

* 4,114 `<san-container>` / `<san-col>` / `<j-card>` / `<j-content>` elements
  became `<div>`, carrying the old tag name as a class and their non-conforming
  attributes as `data-*` (`span="12 tablet-lg-6"` → `data-span="12 tablet-lg-6"`).
* `css/style.min.css` was rewritten to match — 488 rules, 503 attribute
  selectors, so `san-col[span~="12"]` is now `.san-col[data-span~="12"]`.
* 3,170 `j-id` / `san-id` / `js-slide` / `j-display` attributes on ordinary
  elements became `data-*`. All 13 JS selectors and 82 CSS selectors that query
  them were updated in the same pass, so behaviour is unchanged.

### Links and files

* 9,096 extensionless hrefs now point at real `.html` files.
* 1,290 references to `/` and `/nl` resolve to `/index.html`. `nl.html` was
  renamed to `index.html`, since the Dutch page is the site root.
* `en.html` was deleted (byte-identical to `en/index.html`), as was
  `style.min (1).css` (byte-identical to `style.min.css`).
* `assets/images/favicon.png` was generated from the logo. It was referenced on
  every page but had never been captured.
* Google Tag Manager (script + noscript iframe) removed from all 215 pages.

### Repairs to defects already in the source

The captured HTML had structural damage that any parser propagates. Fixed:

* **An unclosed `<a>` in the cookie banner on 213 pages.** It opened
  `<a href="…/cookies.html">`, never filled or closed it, so every following
  element parsed as a child of that anchor — roughly 88 cascading errors per page.
* **64 unescaped `"` inside attribute values.** Product names use the inch mark
  (`KNOTTED BONE 6-7"`), which truncated the attribute and pushed the rest of
  the tag — sometimes the following `<div>`, `<li>` and `<img>` — into the
  attribute region. Now escaped as `&quot;`.
* 5,581 missing spaces between attributes; 1,305 bare `&`; 440 single-quoted
  values; 228 duplicate attributes; 110 ids beginning with a digit.
* 736 `<div>`s inside `<button>` and 860 inside `<summary>` → `<span>`
  (both elements only permit phrasing content).
* 177 hidden `<input>`s inside `<a>` — outside any form, read by nothing.
* 734 `<button>`s missing `type` → `type="button"`.
* 17 `<img srcset>` with no `src`; one `<p>` wrapping a `<table>`.

### Accessibility

Three real bugs, fixed at the cause rather than silenced:

* **Submenu links were tabbable while hidden.** Collapsed submenus used
  `height:0; opacity:0` and carried `aria-hidden="true"`, so keyboard users
  could tab into links screen readers were told to ignore. Added
  `visibility:hidden` / `visible`, then dropped the now-redundant static
  attribute — `wiamenuitem.mjs` still sets it dynamically.
* **Nav submenus could not be opened by keyboard at all.** 430
  `<span role="button">` toggles had no `tabindex`. They are now real
  `<button type="button">`, with a reset on `.main-nav__toggle-submenu` so the
  native button chrome does not alter the look.
* Decorative `<i>` icons carried `aria-label` (invalid on `<i>`, and misspelled
  `"pevious"`); the parent button already had the correct label, so the icons
  are now `aria-hidden="true"`. Plus honeypot fields given `tabindex="-1"`,
  `autocomplete="false"` → `"off"`, and a missing password autocomplete.

---

## Copy you should review

The cookie banner's anchor had **no link text at all** in the source. Text was
supplied so the sentence reads and the tag closes:

| file            | inserted text                          |
| --------------- | -------------------------------------- |
| `en/**`         | `cookie statement`                     |
| `index.html`    | `cookieverklaring`                     |
| `de.html`       | `Cookie-Erklärung`                     |
| `fr.html`       | `déclaration relative aux cookies`     |

Adjust to taste — nothing else depends on the wording.

---

## Known remaining issues

**229 internal references still dead** (124 unique). Almost all are `nl/`,
`de/`, `fr/` subpages that were never captured — only `en/` was mirrored, so
the root `de.html` and `fr.html` are orphan pages whose menus point into
directories that do not exist. A handful are missing `uploads/icon/*.png`.

**1,199 references still point at `sanux.100.nl`**, the original agency CDN.
These were not downloadable from the conversion environment. To localise them:

```bash
wget -r -np -nH --cut-dirs=2 -P uploads/ https://sanux.100.nl/uploads/gdpetfood.com/
# then rewrite the references
grep -rl 'sanux.100.nl' --include='*.html' . \
  | xargs sed -i 's|https://sanux\.100\.nl/uploads/gdpetfood\.com/|/uploads/|g'
```

**404 remaining lint findings**, both advisory rather than conformance failures:

* 394 × `prefer-native-element` — accordion triggers using
  `<div tabindex="0" role="button">`. This is valid ARIA and keyboard-reachable
  (unlike the nav toggles, which were not). Converting them means restructuring
  their block children, which could not be verified without a browser.
* 10 × `wcag/h32` — filter forms with no submit button. They submit via JS on
  change; adding a real submit is a decision about no-JS behaviour.

---

## Rebuilding

`_build-scripts/` holds the pipeline, to re-run against a fresh capture. Order
matters — pass 0 repairs the source *before* anything parses it, which is what
prevents the broken tags from corrupting later passes.

```
0_repair_source.py     stray quotes + missing attribute spacing (reads repo/, writes src-fixed/)
1_convert.py           logo extraction, tag conversion, CSS rewrite, links, GTM removal
2_markup_repair.py     unclosed anchor, entities, quoting, duplicate attrs, ids
3_summary_submenu.py   <summary> content model + submenu visibility
4_attributes.py        j-id/san-id/js-slide/j-display → data-*, with JS selectors
5_content_model.py     <button>/<a> content model, button type, icon labels
6_accessibility.py     span→button, static aria-hidden, form autocomplete
7_final_lint_fixes.py  honeypot tabindex, empty headings, redundant aria-label
```

After pass 4 and pass 6, apply the CSS selector rename for `[j-display` and
`[san-id` → `[data-j-display` / `[data-san-id` (82 selectors).

Validate with:

```bash
npx html-validate --config .htmlvalidate.json '**/*.html'
```
