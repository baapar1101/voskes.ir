// Extracts the ~20 bespoke one-off pages (nav landing pages, static pages)
// into raw HTML partials + thin .astro wrapper pages, using the same
// head/body-class/content-block pattern proven for /en/index.html in
// Phase 2. These pages don't share a template with anything else, so per
// doc §3.2 they're ported individually rather than pulled into a content
// collection.
//
// Single-locale flattening (see DECISIONS.md): the Dutch root page is
// dropped, the language switcher is stripped from the header (nothing
// left to switch to), and every source path under en/ is read but written
// to src/pages/ WITHOUT the en/ prefix — en/index.html becomes the new
// site root, en/cat.html -> cat.astro, etc. Internal /en/... links in the
// extracted HTML are rewritten to drop the prefix accordingly.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { rewriteEnLinks, rewriteEnUrl } from './lib/rewrite-links.mjs';

// voskes.ir/ was overwritten mid-session by an unrelated concurrent
// process (see DECISIONS.md, "Mid-migration source drift, part 2") — the
// original static HTML no longer exists there. Reading from this
// project's own dist/ build output instead: it was verified byte-exact
// (text + class attributes) against the real source before that happened,
// so it's a faithful stand-in for the one-off pages specifically.
const ROOT = new URL('../dist/', import.meta.url);
const PAGES = new URL('../src/pages/', import.meta.url);

// [source path relative to voskes.ir/, output .astro path relative to src/pages/]
const PAGES_TO_PORT = [
	['en/index.html', 'index.astro'],
	['en/blog.html', 'blog.astro'],
	['en/cat.html', 'cat.astro'],
	['en/cat-food.html', 'cat-food.astro'],
	['en/cat-treats.html', 'cat-treats.astro'],
	['en/dog-treats.html', 'dog-treats.astro'],
	['en/cat-food/complementary-wet-food.html', 'cat-food/complementary-wet-food.astro'],
	['en/cat-food/complete-dry-food.html', 'cat-food/complete-dry-food.astro'],
	['en/cat-food/complete-wet-food.html', 'cat-food/complete-wet-food.astro'],
	['en/cat-treats/creams.html', 'cat-treats/creams.astro'],
	['en/cat-treats/drinks.html', 'cat-treats/drinks.astro'],
	['en/cat-treats/jelly-cups.html', 'cat-treats/jelly-cups.astro'],
	['en/cat-treats/soft-chewy-snacks.html', 'cat-treats/soft-chewy-snacks.astro'],
	['en/dog-treats/biscuits.html', 'dog-treats/biscuits.astro'],
	['en/dog-treats/training-treats.html', 'dog-treats/training-treats.astro'],
	['en/contact.html', 'contact.astro'],
	['en/cookies.html', 'cookies.astro'],
	['en/login.html', 'login.astro'],
	['en/our-story.html', 'our-story.astro'],
	['en/privacy.html', 'privacy.astro'],
];

function relativeLayoutPath(astroPath) {
	// astroPath is relative to src/pages/; need to climb out of every
	// directory segment plus one more to get from src/pages/ to src/.
	const depth = astroPath.split('/').length;
	return '../'.repeat(depth) + 'layouts/Base.astro';
}

function jsAttr(str) {
	return JSON.stringify(str);
}

let ok = 0;
for (const [srcRel, outRel] of PAGES_TO_PORT) {
	const html = await readFile(new URL(srcRel, ROOT), 'utf8');
	const $ = load(html, { xmlMode: false });

	const title = $('title').text().trim();
	const description = $('meta[name="description"]').attr('content')?.trim() || '';
	const canonical = rewriteEnUrl($('link[rel="canonical"]').attr('href') || null);
	const ogTitle = $('meta[property="og:title"]').attr('content') || title;
	const ogDescription = $('meta[property="og:description"]').attr('content') || description;
	const bodyClass = $('body').attr('class') || 'Page';

	// Language switcher has nothing left to switch to — drop it.
	$('.menu-lang').remove();

	// Header nav carries an is-active class on the current section's
	// link, so every one-off page gets its own header/cookie/footer
	// snapshot rather than sharing Base's defaults.
	const headerHtml = rewriteEnLinks($.html($('body > div.site > div.menu')));
	const cookieBannerHtml = rewriteEnLinks($.html($('#cookie-notice')));
	const footerHtml = rewriteEnLinks(
		$.html($('body > div.site #page > footer.footer')) + '\n' + $.html($('body > div.site #page > div.payoff'))
	);

	// The :root{} theme block and utility-colors stylesheet are identical
	// across the /en/ tree but not guaranteed identical for one-offs
	// outside it — extract per page (see DECISIONS.md, "Mid-migration
	// source drift" on the NL homepage bug this caught).
	const rootVarsMatch = html.match(/<style>:root[\s\S]*?<\/style>/);
	const rootVars = rootVarsMatch ? rootVarsMatch[0].replace(/^<style>|<\/style>$/g, '') : null;
	const cookieboxMatch = html.match(/<style>\s*\.cookiebox \{[\s\S]*?<\/style>/);
	const cookieboxCss = cookieboxMatch ? cookieboxMatch[0].replace(/^<style>\s*|<\/style>$/g, '') : null;
	const utilityMatch = html.match(/<style>\.bg-c--transparent[\s\S]*?<\/style>/);
	const utilityColors = utilityMatch ? utilityMatch[0].replace(/^<style>|<\/style>$/g, '') : null;

	// Any body-level siblings outside #cookie-notice/script/div.site/script.
	const extraBodyNodes = $('body').children().toArray().filter((el) => {
		if (el.tagName === 'script') return false;
		const id = $(el).attr('id') || '';
		if (id === 'cookie-notice') return false;
		const cls = $(el).attr('class') || '';
		if (cls === 'site' || cls.split(' ').includes('site')) return false;
		return true;
	});
	const extraBodyHtml = extraBodyNodes.length ? rewriteEnLinks(extraBodyNodes.map((el) => $.html(el)).join('\n')) : null;

	const pageChildren = $('body > div.site #page').children().toArray();
	const jsonLdNode = pageChildren.find((el) => el.tagName === 'script');
	const jsonLdText = jsonLdNode ? $(jsonLdNode).html()?.trim() || null : null;
	const contentNodes = pageChildren.filter((el) => {
		if (el.tagName === 'script') return false;
		if (el.tagName === 'footer') return false;
		const cls = $(el).attr('class') || '';
		if (cls.includes('payoff')) return false;
		return true;
	});
	const bodyHtml = rewriteEnLinks(contentNodes.map((el) => $.html(el)).join('\n'));

	const outUrl = new URL(outRel, PAGES);
	const baseName = outRel.split('/').pop().replace(/\.astro$/, '');
	const dirRel = outRel.includes('/') ? outRel.slice(0, outRel.lastIndexOf('/') + 1) : '';
	const partialRel = `${dirRel}_${baseName}.content.html`;
	const headerRel = `${dirRel}_${baseName}.header.html`;
	const cookieRel = `${dirRel}_${baseName}.cookie.html`;
	const footerRel = `${dirRel}_${baseName}.footer.html`;
	const rootVarsRel = `${dirRel}_${baseName}.root-vars.css`;
	const cookieboxCssRel = `${dirRel}_${baseName}.cookiebox.css`;
	const utilityColorsRel = `${dirRel}_${baseName}.utility-colors.css`;
	await mkdir(new URL('.', outUrl), { recursive: true });
	await writeFile(new URL(partialRel, PAGES), bodyHtml);
	await writeFile(new URL(headerRel, PAGES), headerHtml);
	await writeFile(new URL(cookieRel, PAGES), cookieBannerHtml);
	await writeFile(new URL(footerRel, PAGES), footerHtml);
	if (rootVars) await writeFile(new URL(rootVarsRel, PAGES), rootVars);
	if (cookieboxCss) await writeFile(new URL(cookieboxCssRel, PAGES), cookieboxCss);
	if (utilityColors) await writeFile(new URL(utilityColorsRel, PAGES), utilityColors);
	if (extraBodyHtml) {
		await writeFile(new URL(`${dirRel}_${baseName}.extra.html`, PAGES), extraBodyHtml);
	}

	const astroSrc = `---
import Base from '${relativeLayoutPath(outRel)}';
import bodyHtml from './_${baseName}.content.html?raw';
import headerHtml from './_${baseName}.header.html?raw';
import cookieBannerHtml from './_${baseName}.cookie.html?raw';
import footerHtml from './_${baseName}.footer.html?raw';
${extraBodyHtml ? `import extraBodyHtml from './_${baseName}.extra.html?raw';` : ''}
${rootVars ? `import rootVars from './_${baseName}.root-vars.css?raw';` : ''}
${cookieboxCss ? `import cookieboxCss from './_${baseName}.cookiebox.css?raw';` : ''}
${utilityColors ? `import utilityColors from './_${baseName}.utility-colors.css?raw';` : ''}
---

<Base
	title=${jsAttr(title)}
	description=${jsAttr(description)}
	canonical=${jsAttr(canonical || '')}
	headerHtml={headerHtml}
	cookieBannerHtml={cookieBannerHtml}
	footerHtml={footerHtml}
	ogTitle=${jsAttr(ogTitle)}
	ogDescription=${jsAttr(ogDescription)}
	bodyClass=${jsAttr(bodyClass)}
	${jsonLdText ? `jsonLd={${JSON.stringify(jsonLdText)}}` : ''}
	${extraBodyHtml ? `extraBodyHtml={extraBodyHtml}` : ''}
	${rootVars ? `rootVars={rootVars}` : ''}
	${cookieboxCss ? `cookieboxCss={cookieboxCss}` : ''}
	${utilityColors ? `utilityColors={utilityColors}` : ''}
>
	<Fragment set:html={bodyHtml} />
</Base>
`;

	await writeFile(outUrl, astroSrc);
	console.log(`${srcRel} -> src/pages/${outRel}  (bodyClass=${bodyClass} jsonLd=${!!jsonLdText})`);
	ok++;
}

console.log(`Ported ${ok} one-off pages.`);
