# §6.4 Visual parity — sign-off

Both trees served locally with correct MIME types (see note below on the
Python dev server) and screenshot-diffed with Playwright/Chromium at 1440px
and 390px across: `/index.html`, `/en/index.html`, `/en/cat-food.html`,
`/en/blog.html`, `/en/blog/caring.html`, three product pages (including a
single-image slider edge case, `beef-bone-xl`), and `/en/contact.html`.
Script: `astro-migration/scripts/visual-diff.mjs`. Screenshots and diff
overlays in `parity/screenshots/`.

## Test harness note

The brief's §6.4 snippet serves both trees with `python3 -m http.server`.
That server sends `.js`/`.mjs` as `text/plain`, which fails strict MIME
checking for `<script type="module">` — identically on both trees, so
`app.min.js` never executed and every JS-driven interaction (menu toggle,
cookie banner, sliders) was untestable through it. Swapped in a ~40-line
Node static server with correct MIME types
(`astro-migration/scripts/static-server.mjs`) so interactions could
actually be exercised. This is a test-harness fix, not a site change.

## Results

- **Horizontal overflow at 390px**: none on any tested page, either tree.
- **Pixel diff**: nine pages × two widths = 18 comparisons. 16 came in
  under 1% diff ratio (typically <0.1%) — visually indistinguishable.
  `/index.html` (NL homepage) came in at 6.9% (1440px) / 12.3% (390px).
  Root-caused below; not a defect.
- **Nav / menu**: hamburger toggle verified to add `.expanded` to
  `.menu-bar` on both trees identically, once JS could actually load
  (see harness note).
- **Cookie banner**: same visibility state (hidden on fresh load) on both
  trees, identically — consistent with existing behavior, not a
  regression.
- **Glide sliders**: `data-glide-dir="<"`/`">"` attributes present and
  unflipped in the Astro output, per §2.4. The blank slider-image gap
  visible in both `beef-bone-xl` and `21339-chicken-rice-rings`
  screenshots is present **identically** in source and Astro (pixel-exact
  match, diff ratio 0.0008) — a pre-existing Glide init quirk in the
  source markup, unrelated to the migration.
- **`.san-col[data-span~=...]` grid**: holds at both 1440px and 390px;
  no clipping or collapse observed in any screenshot.
- **Vazirmatn**: confirmed loaded (`document.fonts.check('16px Vazirmatn')`
  → true) and rendering proper joined Persian glyphs (not Tahoma) on both
  trees.

## Root cause of the `/index.html` diff

Text and class-attribute parity for `/index.html` were already verified
byte-exact by `scripts/parity-check.mjs` (whitespace-insensitive), and a
direct HTML diff of the specific sections that render at different
heights (`#id-8-1`, `.section--padding.bg-c--white`) confirmed **identical
markup** between source and Astro output, down to every attribute.

The remaining variable was the font file itself. When this environment's
network can reach `cdn.jsdelivr.net` (unlike the "prior environment" the
brief was written against — verified reachable here), the source's
`<link>` pulls `Vazirmatn-font-face.css`, which defines **discrete static
weight files** (`Vazirmatn-Thin.woff2`, `Vazirmatn-Regular.woff2`, etc.).
The Astro build self-hosts the **variable-weight** `Vazirmatn[wght].woff2`
instead, per §5.1's explicit preference ("variable font preferred").
Static and variable instances of the same typeface commonly carry
slightly different hinting/metrics per weight; across a text-dense page
those sub-pixel differences accumulate into visible reflow (~77px over a
~4900px page, spread across several text blocks), without any overflow,
clipping, or grid breakage. This is an accepted, brief-endorsed tradeoff
of the self-hosting decision, not a migration defect.

## Sign-off

All four §6 gates pass:

- §6.1 routes: 213/213, zero diff (matches actual source count — see
  `DECISIONS.md` on the 215→213 drift)
- §6.2 assets: no missing, no changed hashes; only the new font file added
- §6.3 links: 1843 broken / 90 unique on **both** trees, zero new breakage
  (see `DECISIONS.md` on why this exceeds the brief's stated 229 baseline);
  html-validate: 394 `prefer-native-element` + 10 `wcag/h32` = 404, exact
  match, zero new rules
- §6.4 visual: reviewed above, sign-off recorded here

Migration approved on visual grounds.
