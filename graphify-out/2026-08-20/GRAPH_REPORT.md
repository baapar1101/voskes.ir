# Graph Report - voskes.ir  (2026-08-20)

## Corpus Check
- 275 files · ~13,813,129 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 677 nodes · 742 edges · 74 communities (55 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82f47450`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Base.astro
- properties
- content.d.ts
- app.min.js
- wiaSubmenu
- required
- $
- glide.mjs
- required
- package.json
- properties
- wiaMenu
- listen.mjs
- rules
- fetchdata.mjs
- visual-diff.mjs
- tsconfig.json
- cat.astro
- cat-food.astro
- complementary-wet-food.astro
- cat-treats.astro
- creams.astro
- drinks.astro
- jelly-cups.astro
- soft-chewy-snacks.astro
- contact.astro
- cookies.astro
- dog-treats.astro
- biscuits.astro
- training-treats.astro
- index.astro
- login.astro
- privacy.astro
- cookies.js
- pagination.mjs
- parity-check.mjs
- static-server.mjs
- What You Must Do When Invoked
- Migration decisions
- properties
- graphify reference: extra exports and benchmark
- blog.astro
- complete-dry-food.astro
- complete-wet-food.astro
- our-story.astro
- graphify reference: query, path, explain
- Astro Starter Kit: Minimal
- AGENTS.md
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- Local preview
- CLAUDE.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Voskes.ir project graph
- analyticalComponents
- available
- bodyDescription
- composition
- heading
- jsonLd
- ogTitle
- $schema
- sliderNextLabel
- sliderPrevLabel
- slug
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `required` - 22 edges
2. `wiaSubmenu` - 14 edges
3. `$` - 12 edges
4. `What You Must Do When Invoked` - 12 edges
5. `rules` - 11 edges
6. `Migration decisions` - 11 edges
7. `wiaMenu` - 10 edges
8. `wiaMenuItem` - 10 edges
9. `wiaSubmenuItem` - 10 edges
10. `/graphify` - 10 edges

## Surprising Connections (you probably didn't know these)
- `patchDir()` --calls--> `rewriteEnLinks()`  [EXTRACTED]
  scripts/patch-collection-links.mjs → scripts/lib/rewrite-links.mjs
- `patchDir()` --calls--> `rewriteEnUrl()`  [EXTRACTED]
  scripts/patch-collection-links.mjs → scripts/lib/rewrite-links.mjs

## Import Cycles
- None detected.

## Communities (74 total, 19 thin omitted)

### Community 0 - "Base.astro"
Cohesion: 0.16
Nodes (7): ./partials/cookie-banner.html?raw, ./partials/cookiebox.css?raw, ./partials/footer.html?raw, ./partials/header.html?raw, ./partials/root-vars.css?raw, ./partials/utility-colors.css?raw, products

### Community 1 - "properties"
Cohesion: 0.12
Nodes (17): anyOf, type, anyOf, anyOf, anyOf, type, properties, additives (+9 more)

### Community 2 - "content.d.ts"
Cohesion: 0.06
Nodes (28): AllValuesOf, astro:content, CollectionEntry, CollectionKey, ContentConfig, DataEntryMap, ExtractCollectionFilterType, ExtractDataType (+20 more)

### Community 3 - "app.min.js"
Cohesion: 0.08
Nodes (30): bootstrapImports(), createCookie(), initTextfade(), textFade(), ./modules/animatecss.mjs, ./modules/dealers.mjs, expandsKeyDownHandler(), initExpands() (+22 more)

### Community 4 - "wiaSubmenu"
Cohesion: 0.07
Nodes (4): wiaMenuItem, wiaMegamenu, wiaSubmenu, wiaSubmenuItem

### Community 5 - "required"
Cohesion: 0.08
Nodes (23): canonical, ogDescription, ogTitle, slug, title, required, $schema, type (+15 more)

### Community 6 - "$"
Cohesion: 0.10
Nodes (21): files, OUT, SRC, PAGES, PAGES_TO_PORT, ROOT, files, OUT (+13 more)

### Community 7 - "glide.mjs"
Cohesion: 0.10
Nodes (10): Glide(), isFunction(), isObject(), mergeOptions(), mount(), now(), Peeking(), sortBreakpoints() (+2 more)

### Community 8 - "required"
Cohesion: 0.17
Nodes (13): items, type, items, type, required, type, description, benefits (+5 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (22): cheerio, dependencies, astro, devDependencies, cheerio, pixelmatch, playwright, pngjs (+14 more)

### Community 10 - "properties"
Cohesion: 0.06
Nodes (30): type, type, type, canonical, description, ogDescription, ogTitle, slug (+22 more)

### Community 12 - "listen.mjs"
Cohesion: 0.11
Nodes (6): init(), submitFilters(), submitFiltersWithoutClickEvent(), init(), registerDownload(), successTracker()

### Community 13 - "rules"
Cohesion: 0.14
Nodes (13): extends, rules, attribute-boolean-style, long-title, no-inline-style, no-trailing-whitespace, require-sri, void-style (+5 more)

### Community 14 - "fetchdata.mjs"
Cohesion: 0.36
Nodes (9): infiniteLoadMore(), startInfiniteScroll(), updateInfinite(), _callback(), get(), _handleError(), _handleResponse(), post() (+1 more)

### Community 15 - "visual-diff.mjs"
Cohesion: 0.20
Nodes (7): bigDiffs, interactions, OUT, overflowFails, PAGES, results, WIDTHS

### Community 16 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, exclude, extends, include

### Community 17 - "cat.astro"
Cohesion: 0.25
Nodes (7): ./_cat.content.html?raw, ./_cat.cookie.html?raw, ./_cat.cookiebox.css?raw, ./_cat.footer.html?raw, ./_cat.header.html?raw, ./_cat.root-vars.css?raw, ./_cat.utility-colors.css?raw

### Community 18 - "cat-food.astro"
Cohesion: 0.25
Nodes (7): ./_cat-food.content.html?raw, ./_cat-food.cookie.html?raw, ./_cat-food.cookiebox.css?raw, ./_cat-food.footer.html?raw, ./_cat-food.header.html?raw, ./_cat-food.root-vars.css?raw, ./_cat-food.utility-colors.css?raw

### Community 19 - "complementary-wet-food.astro"
Cohesion: 0.25
Nodes (7): ./_complementary-wet-food.content.html?raw, ./_complementary-wet-food.cookie.html?raw, ./_complementary-wet-food.cookiebox.css?raw, ./_complementary-wet-food.footer.html?raw, ./_complementary-wet-food.header.html?raw, ./_complementary-wet-food.root-vars.css?raw, ./_complementary-wet-food.utility-colors.css?raw

### Community 20 - "cat-treats.astro"
Cohesion: 0.25
Nodes (7): ./_cat-treats.content.html?raw, ./_cat-treats.cookie.html?raw, ./_cat-treats.cookiebox.css?raw, ./_cat-treats.footer.html?raw, ./_cat-treats.header.html?raw, ./_cat-treats.root-vars.css?raw, ./_cat-treats.utility-colors.css?raw

### Community 21 - "creams.astro"
Cohesion: 0.25
Nodes (7): ./_creams.content.html?raw, ./_creams.cookie.html?raw, ./_creams.cookiebox.css?raw, ./_creams.footer.html?raw, ./_creams.header.html?raw, ./_creams.root-vars.css?raw, ./_creams.utility-colors.css?raw

### Community 22 - "drinks.astro"
Cohesion: 0.25
Nodes (7): ./_drinks.content.html?raw, ./_drinks.cookie.html?raw, ./_drinks.cookiebox.css?raw, ./_drinks.footer.html?raw, ./_drinks.header.html?raw, ./_drinks.root-vars.css?raw, ./_drinks.utility-colors.css?raw

### Community 23 - "jelly-cups.astro"
Cohesion: 0.25
Nodes (7): ./_jelly-cups.content.html?raw, ./_jelly-cups.cookie.html?raw, ./_jelly-cups.cookiebox.css?raw, ./_jelly-cups.footer.html?raw, ./_jelly-cups.header.html?raw, ./_jelly-cups.root-vars.css?raw, ./_jelly-cups.utility-colors.css?raw

### Community 24 - "soft-chewy-snacks.astro"
Cohesion: 0.25
Nodes (7): ./_soft-chewy-snacks.content.html?raw, ./_soft-chewy-snacks.cookie.html?raw, ./_soft-chewy-snacks.cookiebox.css?raw, ./_soft-chewy-snacks.footer.html?raw, ./_soft-chewy-snacks.header.html?raw, ./_soft-chewy-snacks.root-vars.css?raw, ./_soft-chewy-snacks.utility-colors.css?raw

### Community 25 - "contact.astro"
Cohesion: 0.25
Nodes (7): ./_contact.content.html?raw, ./_contact.cookie.html?raw, ./_contact.cookiebox.css?raw, ./_contact.footer.html?raw, ./_contact.header.html?raw, ./_contact.root-vars.css?raw, ./_contact.utility-colors.css?raw

### Community 26 - "cookies.astro"
Cohesion: 0.25
Nodes (7): ./_cookies.content.html?raw, ./_cookies.cookie.html?raw, ./_cookies.cookiebox.css?raw, ./_cookies.footer.html?raw, ./_cookies.header.html?raw, ./_cookies.root-vars.css?raw, ./_cookies.utility-colors.css?raw

### Community 27 - "dog-treats.astro"
Cohesion: 0.25
Nodes (7): ./_dog-treats.content.html?raw, ./_dog-treats.cookie.html?raw, ./_dog-treats.cookiebox.css?raw, ./_dog-treats.footer.html?raw, ./_dog-treats.header.html?raw, ./_dog-treats.root-vars.css?raw, ./_dog-treats.utility-colors.css?raw

### Community 28 - "biscuits.astro"
Cohesion: 0.25
Nodes (7): ./_biscuits.content.html?raw, ./_biscuits.cookie.html?raw, ./_biscuits.cookiebox.css?raw, ./_biscuits.footer.html?raw, ./_biscuits.header.html?raw, ./_biscuits.root-vars.css?raw, ./_biscuits.utility-colors.css?raw

### Community 29 - "training-treats.astro"
Cohesion: 0.25
Nodes (7): ./_training-treats.content.html?raw, ./_training-treats.cookie.html?raw, ./_training-treats.cookiebox.css?raw, ./_training-treats.footer.html?raw, ./_training-treats.header.html?raw, ./_training-treats.root-vars.css?raw, ./_training-treats.utility-colors.css?raw

### Community 30 - "index.astro"
Cohesion: 0.25
Nodes (7): ./_index.content.html?raw, ./_index.cookie.html?raw, ./_index.cookiebox.css?raw, ./_index.footer.html?raw, ./_index.header.html?raw, ./_index.root-vars.css?raw, ./_index.utility-colors.css?raw

### Community 31 - "login.astro"
Cohesion: 0.25
Nodes (7): ./_login.content.html?raw, ./_login.cookie.html?raw, ./_login.cookiebox.css?raw, ./_login.footer.html?raw, ./_login.header.html?raw, ./_login.root-vars.css?raw, ./_login.utility-colors.css?raw

### Community 32 - "privacy.astro"
Cohesion: 0.25
Nodes (7): ./_privacy.content.html?raw, ./_privacy.cookie.html?raw, ./_privacy.cookiebox.css?raw, ./_privacy.footer.html?raw, ./_privacy.header.html?raw, ./_privacy.root-vars.css?raw, ./_privacy.utility-colors.css?raw

### Community 33 - "cookies.js"
Cohesion: 0.67
Nodes (6): acceptAllCookies(), acceptSelectedCookies(), closeCookieNotice(), createCookie(), openCookieNotice(), rejectAllCookies()

### Community 35 - "parity-check.mjs"
Cohesion: 0.67
Nodes (3): check(), normalize(), routes

### Community 42 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 43 - "Migration decisions"
Cohesion: 0.15
Nodes (12): 3.1 Route strategy — (a) Preserve `.html` URLs, 3.2 addendum: product `category` field omitted, 3.2 Content strategy, 3.3 i18n strategy, 5.1 Font self-hosting, 5.2 SEO translations (183 titles / 176 descriptions), §6 baseline drift: 215→213 pages, 229→1843 broken links, Mid-migration source drift (+4 more)

### Community 44 - "properties"
Cohesion: 0.18
Nodes (11): type, type, anyOf, anyOf, properties, alt, description, icon (+3 more)

### Community 45 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 46 - "blog.astro"
Cohesion: 0.25
Nodes (7): ./_blog.content.html?raw, ./_blog.cookie.html?raw, ./_blog.cookiebox.css?raw, ./_blog.footer.html?raw, ./_blog.header.html?raw, ./_blog.root-vars.css?raw, ./_blog.utility-colors.css?raw

### Community 47 - "complete-dry-food.astro"
Cohesion: 0.25
Nodes (7): ./_complete-dry-food.content.html?raw, ./_complete-dry-food.cookie.html?raw, ./_complete-dry-food.cookiebox.css?raw, ./_complete-dry-food.footer.html?raw, ./_complete-dry-food.header.html?raw, ./_complete-dry-food.root-vars.css?raw, ./_complete-dry-food.utility-colors.css?raw

### Community 48 - "complete-wet-food.astro"
Cohesion: 0.25
Nodes (7): ./_complete-wet-food.content.html?raw, ./_complete-wet-food.cookie.html?raw, ./_complete-wet-food.cookiebox.css?raw, ./_complete-wet-food.footer.html?raw, ./_complete-wet-food.header.html?raw, ./_complete-wet-food.root-vars.css?raw, ./_complete-wet-food.utility-colors.css?raw

### Community 49 - "our-story.astro"
Cohesion: 0.25
Nodes (7): ./_our-story.content.html?raw, ./_our-story.cookie.html?raw, ./_our-story.cookiebox.css?raw, ./_our-story.footer.html?raw, ./_our-story.header.html?raw, ./_our-story.root-vars.css?raw, ./_our-story.utility-colors.css?raw

### Community 50 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 51 - "Astro Starter Kit: Minimal"
Cohesion: 0.40
Nodes (4): Astro Starter Kit: Minimal, 🧞 Commands, 🚀 Project Structure, 👀 Want to learn more?

### Community 52 - "AGENTS.md"
Cohesion: 0.50
Nodes (3): Development, Documentation, graphify

### Community 53 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 54 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 56 - "Local preview"
Cohesion: 0.50
Nodes (3): Local preview, Reproduce uncommitted artifacts, Run the server

## Knowledge Gaps
- **371 isolated node(s):** `$schema`, `type`, `type`, `type`, `type` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `properties` connect `properties` to `composition`, `heading`, `jsonLd`, `ogTitle`, `$schema`, `required`, `sliderNextLabel`, `sliderPrevLabel`, `required`, `slug`, `properties`, `analyticalComponents`, `available`, `bodyDescription`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `required` connect `required` to `required`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `$schema`, `type`, `type` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `properties` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `content.d.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `app.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07564102564102564 - nodes in this community are weakly interconnected._
- **Should `wiaSubmenu` be split into smaller, more focused modules?**
  _Cohesion score 0.06659619450317125 - nodes in this community are weakly interconnected._