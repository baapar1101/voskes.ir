// Extracts the ~20 bespoke one-off pages (nav landing pages, static pages,
// the Dutch homepage) into raw HTML partials + thin .astro wrapper pages,
// using the same head/body-class/content-block pattern proven for
// /en/index.html in Phase 2. These pages don't share a template with
// anything else, so per doc §3.2 they're ported individually rather than
// pulled into a content collection.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';

const ROOT = new URL('../../voskes.nl/', import.meta.url);
const PAGES = new URL('../src/pages/', import.meta.url);

// [source path relative to voskes.nl/, output .astro path relative to src/pages/]
const PAGES_TO_PORT = [
	['index.html', 'index.astro'],
	['en/blog.html', 'en/blog.astro'],
	['en/cat.html', 'en/cat.astro'],
	['en/cat-food.html', 'en/cat-food.astro'],
	['en/cat-treats.html', 'en/cat-treats.astro'],
	['en/dog-treats.html', 'en/dog-treats.astro'],
	['en/cat-food/complementary-wet-food.html', 'en/cat-food/complementary-wet-food.astro'],
	['en/cat-food/complete-dry-food.html', 'en/cat-food/complete-dry-food.astro'],
	['en/cat-food/complete-wet-food.html', 'en/cat-food/complete-wet-food.astro'],
	['en/cat-treats/creams.html', 'en/cat-treats/creams.astro'],
	['en/cat-treats/drinks.html', 'en/cat-treats/drinks.astro'],
	['en/cat-treats/jelly-cups.html', 'en/cat-treats/jelly-cups.astro'],
	['en/cat-treats/soft-chewy-snacks.html', 'en/cat-treats/soft-chewy-snacks.astro'],
	['en/dog-treats/biscuits.html', 'en/dog-treats/biscuits.astro'],
	['en/dog-treats/training-treats.html', 'en/dog-treats/training-treats.astro'],
	['en/contact.html', 'en/contact.astro'],
	['en/cookies.html', 'en/cookies.astro'],
	['en/login.html', 'en/login.astro'],
	['en/our-story.html', 'en/our-story.astro'],
	['en/privacy.html', 'en/privacy.astro'],
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
	const canonical = $('link[rel="canonical"]').attr('href') || null;
	const ogTitle = $('meta[property="og:title"]').attr('content') || title;
	const ogDescription = $('meta[property="og:description"]').attr('content') || description;
	const bodyClass = $('body').attr('class') || 'Page';
	const lang = $('html').attr('lang') || 'fa';
	const dir = $('html').attr('dir') || 'rtl';

	// Header nav carries an is-active class on the current section's link,
	// and the root NL homepage links to an entirely different /nl/ route
	// tree with its own footer/cookie-banner — so every one-off page gets
	// its own header/cookie/footer snapshot rather than sharing Base's
	// defaults (those defaults come from /en/index.html, which has no
	// active nav item).
	const headerHtml = $.html($('body > div.site > div.menu'));
	const cookieBannerHtml = $.html($('#cookie-notice'));
	const footerHtml = $.html($('body > div.site #page > footer.footer')) + '\n' + $.html($('body > div.site #page > div.payoff'));

	// Any body-level siblings outside #cookie-notice/script/div.site/script
	// (e.g. the NL homepage's newsletter <details class="popup">).
	const extraBodyNodes = $('body').children().toArray().filter((el) => {
		if (el.tagName === 'script') return false;
		const id = $(el).attr('id') || '';
		if (id === 'cookie-notice') return false;
		const cls = $(el).attr('class') || '';
		if (cls === 'site' || cls.split(' ').includes('site')) return false;
		return true;
	});
	const extraBodyHtml = extraBodyNodes.length ? extraBodyNodes.map((el) => $.html(el)).join('\n') : null;

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
	const bodyHtml = contentNodes.map((el) => $.html(el)).join('\n');

	const outUrl = new URL(outRel, PAGES);
	const baseName = outRel.split('/').pop().replace(/\.astro$/, '');
	const dirRel = outRel.includes('/') ? outRel.slice(0, outRel.lastIndexOf('/') + 1) : '';
	const partialRel = `${dirRel}_${baseName}.content.html`;
	const headerRel = `${dirRel}_${baseName}.header.html`;
	const cookieRel = `${dirRel}_${baseName}.cookie.html`;
	const footerRel = `${dirRel}_${baseName}.footer.html`;
	await mkdir(new URL('.', outUrl), { recursive: true });
	await writeFile(new URL(partialRel, PAGES), bodyHtml);
	await writeFile(new URL(headerRel, PAGES), headerHtml);
	await writeFile(new URL(cookieRel, PAGES), cookieBannerHtml);
	await writeFile(new URL(footerRel, PAGES), footerHtml);
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
>
	<Fragment set:html={bodyHtml} />
</Base>
`;

	await writeFile(outUrl, astroSrc);
	console.log(`${srcRel} -> src/pages/${outRel}  (lang=${lang} dir=${dir} bodyClass=${bodyClass} jsonLd=${!!jsonLdText})`);
	ok++;
}

console.log(`Ported ${ok} one-off pages.`);
