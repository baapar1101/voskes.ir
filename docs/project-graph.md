# Voskes.ir project graph

```mermaid
flowchart TB
    browser[Visitor browser]
    build[Astro build]
    site[Generated static site]

    subgraph routes[Astro routes: src/pages]
        direction TB
        primary[Primary pages\n/ · /cat · /cat-food · /cat-treats · /dog-treats\n/blog · /contact · /our-story · /login · /cookies · /privacy]
        categories[Category pages\n/cat-food/* · /cat-treats/* · /dog-treats/*]
        productRoute[Dynamic product route\n/products/[slug]]
        blogRoute[Dynamic blog route\n/blog/[slug]]
    end

    subgraph presentation[Shared presentation]
        base[layouts/Base.astro]
        chrome[Shared chrome\nheader · footer · cookie banner]
        pageFragments[Route-specific raw fragments\nHTML · CSS variables · utility CSS]
    end

    subgraph content[Content collections]
        config[content.config.ts\ncollection schemas]
        products[181 product JSON entries]
        posts[11 blog JSON entries]
    end

    subgraph assets[Static assets: public]
        styles[CSS\nstyle.min.css]
        scripts[JavaScript\napp.min.js · cookies.js]
        media[Product and page media\nassets · uploads]
    end

    browser --> site
    build --> site

    primary --> base
    categories --> base
    productRoute --> base
    blogRoute --> base

    primary --> pageFragments
    categories --> pageFragments
    base --> chrome
    base --> styles
    base --> scripts
    primary --> media
    categories --> media
    productRoute --> media

    config --> products
    config --> posts
    products --> productRoute
    posts --> blogRoute

    routes --> build
    presentation --> build
    content --> build
    assets --> build
```

## Reading the graph

- The site is a static Astro application built from file-based routes in `src/pages`.
- Most routes compose page-specific HTML and CSS fragments through `layouts/Base.astro`.
- Product and blog detail pages are generated at build time from the `products` and `blog` content collections.
- Files in `public` are copied into the generated site and are referenced directly by the shared layout and pages.
