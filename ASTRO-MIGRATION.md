# Astro migration brief — voskes.nl (Persian / RTL)

Working document for Claude Code. Read this fully before running anything.

---

## 0. The one rule

**Build into `astro-migration/`. Do not write to, move, or delete anything in the
existing static site until every gate in §6 passes.**

```
repo-root/
├── voskes.nl/          ← SOURCE OF TRUTH. read-only for this whole task.
├── astro-migration/    ← everything you create goes here
└── ASTRO-MIGRATION.md  ← this file
```

If you need to modify a source file to make the migration work, that is a signal
the migration is wrong — fix the Astro side instead. The only acceptable writes
outside `astro-migration/` are to `parity/` (see §6), which you may create.

---

## 1. What you are migrating

A 215-page static site, already converted from a scraped mirror and already
localized to Persian RTL. Current state:

| | |
|---|---|
| HTML pages | 215 |
| Total files | 314 |
| Size | 33 MB |
| Stylesheet | one 340 KB `css/style.min.css` (minified, RTL-converted) |
| JS | ES modules, `js/app.min.js` entry + `js/modules/*.mjs` |
| Validation baseline | **404 findings** (394 `prefer-native-element`, 10 `wcag/h32`) |

Route shape:

```
/index.html                     Dutch homepage (site root)
/de.html /fr.html               orphan language pages
/en/index.html                  English homepage
/en/{cat,contact,our-story,cookies,privacy,login,blog,
     cat-food,cat-treats,dog-treats}.html
/en/blog/*.html                 11 posts
/en/cat-food/*.html             3
/en/cat-treats/*.html           4
/en/dog-treats/*.html           2
/en/products/*.html             181
```

Links are **root-absolute with `.html` extensions** (`/en/products/foo.html`).
Astro's default is extensionless directory routes (`/en/products/foo/`). Decide
this deliberately — see §3.1. Getting it wrong silently breaks 12,369 internal
links.

---

## 2. Landmines from the prior work

These cost real debugging time already. Do not rediscover them.

**2.1 — Attribute values contain `>` and `"`.**
`data-glide-dir=">"` is a legitimate value, and product names carry the inch mark
(`KNOTTED BONE 6-7"`). Any regex of the form `<[^>]+>` will split tags in half and
silently corrupt output. If you parse HTML with regex anywhere in this migration,
use a quote-aware pattern: `<(?:"[^"]*"|[^>"])*>`. Prefer a real parser
(`node-html-parser`, `cheerio`, `parse5`).

**2.2 — The CSS is already RTL-converted. Do not run rtlcss again.**
1,182 physical declarations are now logical properties (`margin-inline-start`,
`inset-inline-end`, `text-align:start`). rtlcss flipped the residue that logical
properties cannot express: `translateX`, `transform-origin`, `background-position`,
keyframes. **Running any RTL tool over it a second time flips it back to LTR.**
Treat `css/style.min.css` as a build artifact to copy, not to process.

**2.3 — Icon mirroring is an involution.**
392 directional Font Awesome classes were swapped (`fa-chevron-circle-left` ↔
`-right`). Applying the swap twice restores the original. A marker comment
`<!--i18n:fa icons mirrored-->` sits in every `<head>` to guard this. Preserve the
marker or drop the mirroring logic entirely — do not re-run it.

**2.4 — Glide sliders use native RTL.**
`js/modules/slider.mjs` passes `direction:"rtl"`. Glide inverts `data-glide-dir`
internally via its own `{">":"<"}` map. So the 545 `data-glide-dir` attributes are
**deliberately not flipped**. Flipping them would cancel out and break the arrows.

**2.5 — Custom elements were already de-customized.**
`<san-container>`, `<san-col>`, `<j-card>`, `<j-content>` became `<div>` with the
tag name as a class and `data-*` attributes (`data-span="12 tablet-lg-6"`). The
stylesheet was rewritten to match (`.san-col[data-span~="12"]`). Component
extraction in §4 must preserve these class + `data-*` pairs exactly or the grid
collapses.

**2.6 — JS queries `data-j-id` / `data-san-id`.**
`cookies.js` and `app.min.js` select on these. If you rename or strip attributes
during componentization, the cookie banner and product filters die silently.

---

## 3. Decisions to make before writing code

### 3.1 Route strategy

Two options. Pick one, write it into `astro-migration/DECISIONS.md`, and be
consistent.

**(a) Preserve `.html` URLs** — `build.format: 'file'` in `astro.config.mjs`.
Zero link rewriting, zero redirect burden, byte-comparable routes. Recommended
unless you have a reason not to.

**(b) Move to clean URLs** — `build.format: 'directory'`. Requires rewriting all
12,369 internal links *and* shipping redirects. Only do this if the user has
asked for it. They have not.

### 3.2 Content strategy

181 product pages share one template with different data. Do **not** hand-port 181
`.astro` files. Extract to content collections:

- Parse each `en/products/*.html` into frontmatter + body.
- Fields visible in the markup: title, meta description, category, pack sizes
  (`Available in`), `Composition`, `Analytical components`, `Additives`, benefit
  icons, image srcset set, slider images.
- Store as `src/content/products/*.json` (or `.md` with frontmatter) and render
  through one `src/pages/en/products/[slug].astro`.

Same treatment for `en/blog/*.html` (11 posts).

The remaining ~20 pages are one-offs — port those as individual `.astro` files.

### 3.3 i18n strategy

`i18n/fa.json` (219 keys) and `i18n/pending-fa.json` (2,501 keys) already exist.
The migration is a chance to make translation first-class rather than a
post-processing pass:

- Load `fa.json` as the message catalog.
- Keep `pending-fa.json` as the untranslated queue.
- **Do not** re-run `_build-scripts/8_localize_fa.py` against Astro output. It was
  designed for the static tree and it mutates in place.

---

## 4. Phased plan

Work in order. Do not start a phase until the previous phase's check passes.

### Phase 1 — Scaffold
```bash
npm create astro@latest astro-migration -- --template minimal --no-install --no-git --skip-houston
cd astro-migration && npm install
```
Set in `astro.config.mjs`: `build.format` per §3.1, `site`, and `trailingSlash`.
Copy `assets/`, `css/`, `js/`, `uploads/` into `astro-migration/public/` **verbatim**.
Check: `npm run build` produces an empty-but-valid `dist/`.

### Phase 2 — Layout + one page
Build `src/layouts/Base.astro` carrying `<html lang="fa" dir="rtl">`, the `<head>`
(meta, og, favicon, stylesheet link, font — see §5), the icon-mirror marker, header,
footer, and cookie banner. Port `/en/index.html` through it.
Check: rendered `dist/en/index.html` diffs against source on **text content and
class attributes** (not whitespace).

### Phase 3 — Extract content collections
Write `scripts/extract-products.mjs` and `scripts/extract-blog.mjs` (quote-aware
parsing — §2.1). Emit to `src/content/`.
Check: 181 product entries + 11 blog entries, and every entry has a non-empty
title, description, and at least one image.

### Phase 4 — Dynamic routes
`src/pages/en/products/[slug].astro`, `src/pages/en/blog/[slug].astro` via
`getStaticPaths()`.
Check: `dist/` route count matches source route count exactly (gate §6.1).

### Phase 5 — Remaining pages
The ~20 one-offs, plus `/index.html`, `/de.html`, `/fr.html`.

### Phase 6 — Parity gates
See below. Nothing ships until these pass.

---

## 5. Two open items inherited from the previous session

These are **unfinished work**, not bugs. Fold them into the migration rather than
porting the broken state.

**5.1 — Self-host Vazirmatn (not started).**
All 215 pages currently load the font from `cdn.jsdelivr.net`, which is an
unverified external dependency. During Phase 2:

- Fetch Vazirmatn from GitHub (`rastikerdar/vazirmatn`) or npm (`vazirmatn`) —
  both are reachable; only the jsdelivr CDN was blocked in the prior environment.
- Place woff2 files (variable font preferred) in
  `astro-migration/public/assets/fonts/vazirmatn/`.
- Replace the `<link>` with a local `@font-face`: `font-weight: 100 900`,
  `font-display: swap`.
- Keep the stack exactly:
  `"Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif`
- Verify: `grep -r jsdelivr astro-migration/dist | wc -l` → **0**
  (source currently: 215 hits).

**5.2 — SEO translations (authored, never merged).**
183 page titles and 176 meta descriptions were translated to Persian but the merge
into `fa.json` never completed — the container died mid-write. Right now titles and
descriptions in the source tree are **still English** apart from 13 main-page titles.

If the user still has that work, merge it into `i18n/fa.json` before Phase 3 so the
content collections pick up Persian metadata at extraction time. If not, extract the
English metadata now and translate in the collection layer later — do not block the
migration on it.

---

## 6. Parity gates — all four must pass

Create `parity/` at repo root for the reports.

### 6.1 Route parity
```bash
cd voskes.nl      && find . -name '*.html' | sed 's|^\./||' | sort > ../parity/routes-source.txt
cd ../astro-migration/dist && find . -name '*.html' | sed 's|^\./||' | sort > ../../parity/routes-astro.txt
diff ../../parity/routes-source.txt ../../parity/routes-astro.txt && echo "ROUTES OK"
```
Expect **215 lines, zero diff**.

### 6.2 Asset parity
Every non-HTML file present, byte-identical:
```bash
cd voskes.nl && find . -type f ! -name '*.html' ! -path './_build-scripts/*' \
  -exec md5sum {} \; | sed 's|\./||' | sort -k2 > ../parity/assets-source.txt
cd ../astro-migration/dist && find . -type f ! -name '*.html' \
  -exec md5sum {} \; | sed 's|\./||' | sort -k2 > ../../parity/assets-astro.txt
diff ../../parity/assets-source.txt ../../parity/assets-astro.txt
```
Expected differences: **only** the new self-hosted font files (§5.1). Any missing
asset is a failure. Any changed hash on an existing asset is a failure.

### 6.3 Build / link parity
No broken internal links in the Astro output:
```bash
cd astro-migration/dist
python3 - <<'EOF'
import re,os,glob,collections
ref=re.compile(r'\b(?:href|src)="([^"]+)"')
have={os.path.relpath(os.path.join(r,f),'.').replace(os.sep,'/')
      for r,_,fs in os.walk('.') for f in fs}
bad=collections.Counter()
for f in glob.glob('**/*.html',recursive=True):
    for u in ref.findall(open(f,encoding='utf8').read()):
        if u.startswith(('http','//','data:','mailto:','tel:','#','javascript:')): continue
        p=u.split('?')[0].split('#')[0].lstrip('/')
        if p and p not in have: bad[p]+=1
print("broken:",sum(bad.values()),"unique:",len(bad))
for p,c in bad.most_common(15): print(f"  {c:4} /{p}")
EOF
```
Source baseline is **229 broken refs / 124 unique** — all `nl/`, `de/`, `fr/`
subpages that were never captured, plus a few missing `uploads/icon/*.png`.
Astro output must not **exceed** that. New breakage = failure.

Also confirm validation has not regressed:
```bash
npx html-validate --config voskes.nl/.htmlvalidate.json 'astro-migration/dist/**/*.html'
```
Expect **404 findings** (394 `prefer-native-element` + 10 `wcag/h32`). Both are
pre-existing and accepted. Any new rule appearing is a regression.

### 6.4 Visual parity
Serve both and screenshot-diff. Neither tree needs a server beyond `http.server`:
```bash
(cd voskes.nl && python3 -m http.server 8100 &)
(cd astro-migration/dist && python3 -m http.server 8101 &)
```
Install Playwright in `astro-migration/` and diff at **two widths — 1440 and 390** —
across a representative set: `/index.html`, `/en/index.html`, `/en/cat-food.html`,
`/en/blog.html`, one blog post, three product pages, `/en/contact.html`.

This gate is where RTL problems surface, and it is the one the previous session
could **not** run — no browser was available in that sandbox, so *no rendered output
of this site has ever been visually verified*. Treat every RTL claim as unproven
until this passes. Specifically check:

- no horizontal overflow at 390px
- nav and submenus open, are not clipped, and flow right-to-left
- Glide sliders advance in the correct direction; arrows point correctly
- the `.san-col[data-span~=…]` grid holds at the 48em and 85em breakpoints
- cookie banner, accordions, dropdowns, modals all open and close
- Vazirmatn actually renders (not the Tahoma fallback)

---

## 7. Definition of done

- [ ] `astro-migration/` builds clean; `voskes.nl/` untouched (`git status` shows no
      modifications outside `astro-migration/` and `parity/`)
- [ ] §6.1 routes: 215, zero diff
- [ ] §6.2 assets: no missing, no changed hashes, fonts the only additions
- [ ] §6.3 links ≤ 229 broken; validation still 404 findings, no new rules
- [ ] §6.4 visual diff reviewed at 1440 and 390, sign-off recorded in
      `parity/VISUAL.md`
- [ ] `grep -r jsdelivr astro-migration/dist | wc -l` → 0
- [ ] `DECISIONS.md` records the route-format choice and anything else non-obvious

Only after all boxes are ticked should the original be replaced — and do that as a
separate, reviewable commit.

---

## 8. Prior-art scripts

`voskes.nl/_build-scripts/` holds the eight passes that produced the current tree
(`0_repair_source.py` … `8_localize_fa.py`, plus `logicalize.js`). **Read them for
context — especially `0_repair_source.py`, which documents the malformed-attribute
patterns in §2.1 — but do not run them against the Astro tree.** They mutate in
place and assume the flat static layout.
