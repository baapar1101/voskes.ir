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

## 3.2 Content strategy

- `en/products/*.html` (181) → `src/content/products/*.json`, rendered through
  `src/pages/en/products/[slug].astro`.
- `en/blog/*.html` (11) → `src/content/blog/*.json`, rendered through
  `src/pages/en/blog/[slug].astro`.
- Remaining ~20 pages ported as individual `.astro` files.

## 3.3 i18n strategy

`i18n/fa.json` loaded as the message catalog (text + attr lookup tables).
`i18n/pending-fa.json` kept as the untranslated queue for reference; not
merged automatically. `_build-scripts/8_localize_fa.py` is not run against
the Astro output — it mutates a flat static tree in place and doesn't apply
here.

## 5.1 Font self-hosting

Vazirmatn fetched from npm (`vazirmatn` package) rather than jsdelivr CDN.
Variable-weight woff2 placed under
`astro-migration/public/assets/fonts/vazirmatn/`, referenced via a local
`@font-face` (`font-weight: 100 900; font-display: swap`). Font stack
unchanged: `"Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif`.

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

Searched the repo for the authored-but-unmerged Persian titles/descriptions
mentioned in the migration brief. No such file exists anywhere in
`voskes.nl/` or the repo root — `i18n/fa.json` contains only 219 nav/UI
keys (`_meta`, `text`, `attr`), none of which are page titles or meta
descriptions. That work was lost with the container that produced it.

Decision: extract the current **English** metadata now during content
collection (Phase 3) and do not block the migration on Persian SEO copy.
Translation can be layered on top of `fa.json` / the collection schema
later without a structural change.

## §6 baseline drift: 215→213 pages, 229→1843 broken links

The brief's baselines (215 pages; 229 broken refs / 124 unique) don't match
this tree as it actually exists on disk:

- **Page count**: `find voskes.nl -name '*.html'` returns **213**, not 215.
  The brief's route table lists `/de.html` and `/fr.html` as "orphan
  language pages," but neither file exists anywhere in `voskes.nl/` — that
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

## Repo layout note

The migration brief's `repo-root/{voskes.nl,astro-migration,ASTRO-MIGRATION.md}`
layout assumes `astro-migration/` is a sibling of `voskes.nl/`. That's how
this repo is actually laid out on disk
(`d:\voskes\voskes-fa-rtl\{voskes.nl,astro-migration}`); `ASTRO-MIGRATION.md`
itself is physically inside `voskes.nl/` but is treated as documentation,
not site content, and is left untouched.

No git repository exists at any level yet (`voskes.nl/`, `astro-migration/`,
or the shared parent). Parity checks that reference `git status` will be
run manually against a filesystem diff until/unless the user asks for git
to be initialized.
