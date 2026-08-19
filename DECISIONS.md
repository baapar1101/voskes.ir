# Migration decisions

## 3.1 Route strategy — (a) Preserve `.html` URLs

`build.format: 'preserve'` in `astro.config.mjs`. The brief suggested `'file'`,
but source routes mix both patterns — `/index.html`, `/en/index.html` (dir
index) alongside `/en/contact.html`, `/en/products/*.html` (named files, no
directory) — and Astro's `'file'` format flattens *every* `index.astro`
(including `en/index.astro`) to `parent.html`, which would turn
`/en/index.html` into `/en.html` and break that route. `'preserve'` builds
`src/pages/foo.astro` → `/foo.html` and `src/pages/foo/index.astro` →
`/foo/index.html`, matching source exactly. No link rewriting, no redirects,
byte-comparable routes against the 12,369 existing internal links. Clean URLs
were not requested by the user.

**Superseded by "Single-locale flattening" below**: the `/en/` prefix this
section describes preserving was later dropped entirely at the user's
request. `build.format: 'preserve'` itself is unchanged and still correct
for the reason given above (mixed dir-index/flat-file routes).

## Single-locale flattening (NL root removed, /en/ tree → site root)

User request: drop the other languages and make the `/en/` tree the site
root. Since `de.html`/`fr.html` never existed in this tree (§6 baseline
drift, below) and the only other-language content was the root `/index.html`
(Dutch homepage), this meant:

- Deleted the NL homepage (`src/pages/index.astro` + its partials) and its
  route entirely — no `/nl/...` content exists anywhere else to carry over.
- Every page that used to live under `/en/...` now lives at the
  corresponding root path: `en/index.html` → the new `/index.html`,
  `en/products/*.html` → `/products/*.html`, `en/blog.html` → `/blog.html`,
  etc. 212 pages total (213 − 1 for the dropped NL homepage).
- Rewrote every internal `href`/`src`/`action`/`value` reference from
  `/en/...` to `/...` (and `https://voskes.ir/en/...` to
  `https://voskes.ir/...`) across the header/footer/cookie-banner partials,
  every one-off page body, every product's JSON-LD/extra-content HTML, and
  every blog post body. New shared helper:
  `scripts/lib/rewrite-links.mjs` (`rewriteEnLinks` for HTML blobs,
  `rewriteEnUrl` for single-URL fields like `canonical`). Idempotent —
  safe to run against already-rewritten content.
- Removed the language switcher (`.menu-lang`, the NL/EN/DE/FR flag
  dropdown) from the header entirely — there's nothing left to switch to
  with only one locale.
- Net effect on the pre-existing broken-link baseline: it dropped from
  1843/90 to 92/66. Almost all of that 1843 was every page's language
  switcher linking to the two files that never existed (`de.html`,
  `fr.html`) — removing the switcher removed the artificial inflation,
  leaving only the genuine pre-existing gaps (missing
  `/uploads/icon/*.png` files, one missing `/dog-treats/chewing-treats`
  page, and unreachable form `action` targets on `/contact.html` and
  `/login.html` — none of which had a working backend in this static
  mirror to begin with).
- Route parity (§6.1) and asset-hash parity (§6.2) as originally specified
  no longer apply literally, since the whole point of this change is to
  diverge from source's route shape. Verified instead: exact page count
  (212), zero remaining `/en/` references anywhere in `dist/`, broken-link
  count only in the pre-existing categories above (no new ones), and
  html-validate still at exactly 394 `prefer-native-element` + 10
  `wcag/h32` = 404 findings, zero new rules.

### Mid-migration source drift, part 2

While doing this restructuring, `voskes.ir/` was found to no longer
contain the original static site **at all** — not even the drifted-but-
present state from the first incident (see below). The entire `en/`
directory and all original HTML/CSS/JS/uploads content was gone, replaced
by what is unmistakably a git-tracked copy of *this migration's own work*:
`package.json` name `"astro-migration"`, the same devDependencies this
project installed (cheerio, playwright, pixelmatch, pngjs), and a
`DECISIONS.md` matching this file word-for-word as of an earlier revision.
It's on branch `new`, tracking `github.com/baapar1101/voskes.ir.git`, with
commits this migration didn't make (`"Add TypeScript configuration..."`,
`"Update Astro configuration to allow specific hosts in Vite server
settings"`). A sibling `voskes.ir/` directory also exists. None of this
was caused by this migration — §0's read-only rule held throughout,
verified again via `find voskes.ir -type f -newer <marker>`.

Also found on disk: `d:/voskes/voskes.ir-standard-html/voskes.ir/` — a
different, pre-RTL snapshot of the site (`<html lang="en">`, no
`dir="rtl"`, English throughout, though it does still have `de.html`/
`fr.html`). This is **not** a usable substitute source: it predates the
whole Persian/RTL localization pass this migration is built on top of,
and swapping to it would mean re-doing that localization from scratch,
completely out of scope here. Only its `.htmlvalidate.json` (a
locale-independent ruleset config) was borrowed from it, since this
migration's own copy of that file was lost along with the rest of
`voskes.ir/`.

Recovery path actually used: this migration's own `dist/` build output
(verified byte-exact against the real source in the first drift incident,
before any of this happened) stood in for `voskes.ir/en/*.html` in
`extract-oneoffs.mjs` and `extract-shared-partials.mjs`. Product and blog
content collections were patched in place
(`scripts/patch-collection-links.mjs`) rather than re-extracted, since
their data was already correct and only needed the `/en/` link rewrite —
re-extracting through a render round-trip would have been more fragile
for no benefit. `dist/` is now the only remaining artifact anywhere on
this machine that reflects the original localized source tree; it should
be treated as precious until/unless `voskes.ir/` is restored properly.

## 3.2 Content strategy

- `en/products/*.html` (181) → `src/content/products/*.json`, rendered through
  `src/pages/products/[slug].astro` (moved from `src/pages/en/products/` —
  see "Single-locale flattening" above).
- `en/blog/*.html` (11) → `src/content/blog/*.json`, rendered through
  `src/pages/blog/[slug].astro` (moved from `src/pages/en/blog/`).
- Remaining ~20 pages ported as individual `.astro` files, now at
  `src/pages/*.astro` / `src/pages/*/*.astro` instead of `src/pages/en/...`.

## 3.3 i18n strategy

`i18n/fa.json` loaded as the message catalog (text + attr lookup tables).
`i18n/pending-fa.json` kept as the untranslated queue for reference; not
merged automatically. `_build-scripts/8_localize_fa.py` is not run against
the Astro output — it mutates a flat static tree in place and doesn't apply
here.

## 5.1 Font self-hosting

Originally self-hosted independently here: Vazirmatn fetched from npm
(variable-weight woff2), placed under
`astro-migration/public/assets/fonts/vazirmatn/`, referenced via a local
`@font-face` injected in `Base.astro`.

Superseded mid-migration: the source tree (`voskes.ir/`) was independently
updated (outside this migration — see "Mid-migration source drift" below)
to self-host the same font directly in `css/style.min.css`, adding static
`Vazirmatn-Regular.woff2`/`Vazirmatn-Bold.woff2` alongside the variable
font and stripping the jsdelivr `<link>` from `_build-scripts/8_localize_fa.py`
entirely. Since `css/style.min.css` and `assets/` are copied verbatim
(§1/Phase 1), this migration now inherits that font-hosting approach as-is
and no longer injects its own `@font-face` block — `Base.astro`'s
`<head>` just carries a comment pointing here. Font stack unchanged:
`"Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif`.

## 3.2 addendum: product `category` field omitted

The brief lists `category` among the fields to extract into the product
content collection. It isn't recoverable from this tree: category
membership was resolved server-side by a filter/pagination system
(`js/modules/product-filters.mjs` submits a GET form; `infinite_scroll.mjs`
paginates) that has no backend behind it anymore — it's a static mirror.
Listing pages (`cat.html`, `cat-food.html`, etc.) each expose only the
first 18 products with no per-card category markup, and all four listing
pages tested return the same 18 regardless of which category they claim
to represent. Rather than fabricate a category taxonomy, `category` was
left out of the schema; everything the markup actually contains (title,
both descriptions, images, pack size, composition/analytical/additives,
benefit icons, SKU/GTIN, JSON-LD) is extracted. See
`scripts/extract-products.mjs` header comment.

## 5.2 SEO translations (183 titles / 176 descriptions)

Originally: no trace of the authored-but-unmerged Persian titles/
descriptions existed anywhere in the repo (`i18n/fa.json` had only 219
nav/UI keys). Extracted current English metadata instead and didn't block
on it, per the brief's own fallback instruction.

Resolved mid-migration: `i18n/fa.json` gained ~755 new lines of title/
description translations (outside this migration — see "Mid-migration
source drift" below) and `_build-scripts/8_localize_fa.py` was re-run
against `voskes.ir/`, pushing the new Persian copy into ~200 pages'
`<title>`/`<meta description>`/body text. Content extraction
(`scripts/extract-products.mjs`, `extract-blog.mjs`, `extract-oneoffs.mjs`)
was re-run against the updated source and now picks up this translated
copy directly — no separate merge step was needed since these scripts
just re-read whatever `voskes.ir/` currently contains.

## §6 baseline drift: 215→213 pages, 229→1843 broken links

The brief's baselines (215 pages; 229 broken refs / 124 unique) don't match
this tree as it actually exists on disk:

- **Page count**: `find voskes.ir -name '*.html'` returns **213**, not 215.
  The brief's route table lists `/de.html` and `/fr.html` as "orphan
  language pages," but neither file exists anywhere in `voskes.ir/` — that
  accounts for the gap exactly (215 − 2 = 213). Treated 213 as ground truth
  for the route-parity gate (§6.1) rather than chasing two files that were
  never actually produced.
- **Broken links**: 1843 broken / 90 unique on the source tree itself (not
  229/124) when run today. 852 + 852 of those are every single page's
  language-switcher linking to the (non-existent) `/de.html` and
  `/fr.html` — i.e. the same missing-file gap as above, multiplied across
  every page that carries the nav. The rest are pre-existing `/nl/*` and
  `/uploads/icon/*` gaps consistent in kind with the brief's description.
  Astro output was verified to produce the **identical** 1843/90 — zero
  new breakage — so the gate (§6.3, "must not exceed source baseline")
  passes against the real source baseline even though it doesn't match
  the number written in the brief.

## Mid-migration source drift

Partway through this migration, `voskes.ir/` changed underneath it —
not from anything this migration did (it stayed read-only per §0
throughout), but from concurrent activity elsewhere in the workspace:
`voskes.ir/` gained a git repo (`bee726c "first commit"`, remote
`github.com/baapar1101/voskes.ir.git`) with substantial uncommitted
changes, covering exactly the two items §5 flagged as unfinished
(translations merged, font self-hosted directly on the static site — see
§5.1/§5.2 above). A sibling `voskes.ir/` directory also appeared.

This was caught because a routine re-run of the parity checker
(`scripts/parity-check.mjs`) that had previously read 0/213 started
failing on 10 pages — the extracted content collections were stale
against the new source text. Response: re-ran all three extraction
scripts (`extract-products.mjs`, `extract-blog.mjs`, `extract-oneoffs.mjs`)
and re-copied `public/{assets,css,js,uploads}/` from the current
`voskes.ir/`, then re-verified all four §6 gates from scratch. All pass
against the updated source. `voskes.ir -type f -newer` was used to
confirm this migration never wrote into `voskes.ir/` itself at any point.

One genuine bug surfaced during re-verification and is worth recording
because it would silently reappear on any future re-sync: the root
`/index.html` (NL homepage) carries its **own** per-page `:root{}` theme
block and utility-colors stylesheet, different from the ones shared
across the entire `/en/` tree (verified: `en/index.html`, `en/contact.html`,
every product page, and every blog post all carry byte-length-identical
blocks; only the root NL page differs — e.g. `--font_size_h2: 3.5rem`
there vs `4rem` in `/en/`). `Base.astro` originally hardcoded the `/en/`
tree's values as the only theme, which rendered the NL homepage with
wrong type sizes (a `<h2>` at 40px instead of 35px, cascading into a
~77px total page-height drift once enough text blocks got the wrong
size). Fixed by adding `rootVars`/`cookieboxCss`/`utilityColors` override
props to `Base.astro` (same pattern already used for
`headerHtml`/`cookieBannerHtml`/`footerHtml`), and having
`extract-oneoffs.mjs` extract these three blocks **per page** rather than
assuming they're shared — cheap insurance against any other one-off page
turning out to have its own theme too.

Separately (harmless, no fix needed): the source's `<details class="popup">`
newsletter signup carries baked-in inline `--closed`/`--open`/
`--child-open` custom properties from whatever process originally
captured the static mirror post-JS-execution. `js/modules/popup.mjs`
unconditionally recomputes all three via `scrollHeight` measurement on
every page load, so this self-heals identically on both trees regardless
of whether the static markup happens to carry a stale baked-in value —
confirmed by reading the module, not just by observation.

## Repo layout note

The migration brief's `repo-root/{voskes.ir,astro-migration,ASTRO-MIGRATION.md}`
layout assumes `astro-migration/` is a sibling of `voskes.ir/`. That's how
this repo is actually laid out on disk
(`d:\voskes\voskes-fa-rtl\{voskes.ir,astro-migration}`); `ASTRO-MIGRATION.md`
itself is physically inside `voskes.ir/` but is treated as documentation,
not site content, and is left untouched.

Started with no git repository anywhere. `voskes.ir/` gained one mid-session
(see "Mid-migration source drift" above), pointed at
`github.com/baapar1101/voskes.ir.git` — not something this migration set
up. `astro-migration/` itself and the shared parent still have no git repo.
Definition-of-done's "`git status` shows no modifications outside
`astro-migration/` and `parity/`" was verified instead via
`voskes.ir -type f -newer <marker>`, confirming this migration never wrote
into `voskes.ir/`.
