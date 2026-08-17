// Extracts src/content/products/*.json from voskes.nl/en/products/*.html.
//
// Category is intentionally omitted: the source is a scraped static mirror of
// a CMS-driven site, and the client-side filter/pagination system
// (js/modules/product-filters.mjs, infinite_scroll.mjs) that used to resolve
// category membership submits a GET form against a static file with no
// backend behind it. Listing pages (cat.html, cat-food.html, ...) only ever
// expose the first 18 products of what was originally a paginated, filtered
// API response, so there is no static source of truth for category mapping
// left in the tree. See DECISIONS.md.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';

const SRC = new URL('../../voskes.nl/en/products/', import.meta.url);
const OUT = new URL('../src/content/products/', import.meta.url);

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith('.html'));
let ok = 0;

for (const file of files) {
	const slug = file.replace(/\.html$/, '');
	const html = await readFile(new URL(file, SRC), 'utf8');
	const $ = load(html, { xmlMode: false });

	const jsonLdRaw = $('script[type="application/ld+json"]').first().html();
	const jsonLd = jsonLdRaw ? JSON.parse(jsonLdRaw) : null;
	const jsonLdText = jsonLdRaw ? jsonLdRaw.trim() : null;

	// Almost every product page is exactly one .section.product__container
	// between the optional JSON-LD <script> and the footer. A single page
	// (duck-fillet-hearts) has an extra trailing d--flex block (a blog-post
	// teaser card) after the product container — capture it verbatim as
	// extraHtml so it isn't silently dropped.
	const pageChildren = $('body > div.site #page').children().toArray();
	const extraNodes = pageChildren.filter((el) => {
		if (el.tagName === 'script') return false;
		if (el.tagName === 'footer') return false;
		const cls = $(el).attr('class') || '';
		if (cls.includes('payoff')) return false;
		if (cls.includes('product__container') || $(el).find('.product__container').length) return false;
		return true;
	});
	const extraHtml = extraNodes.length ? extraNodes.map((el) => $.html(el)).join('\n') : null;

	const title = $('title').text().trim();
	const description = $('meta[name="description"]').attr('content')?.trim() || jsonLd?.description?.trim() || '';
	const canonical = $('link[rel="canonical"]').attr('href') || `https://voskes.nl/en/products/${slug}`;
	const ogTitle = $('meta[property="og:title"]').attr('content') || title;
	const ogDescription = $('meta[property="og:description"]').attr('content') || description;

	const heading = $('.product__headings h1').first().text().trim();
	const bodyDescription = $('.product__description').first().text().trim() || null;

	const images = $('.product-slider__images img')
		.map((i, el) => ({ src: $(el).attr('src'), alt: $(el).attr('alt') || '' }))
		.get()
		.filter((img) => img.src);

	const sliderPrevLabel = $('.product-slider__controls--prev').attr('aria-label') || 'اسلاید قبلی';
	const sliderNextLabel = $('.product-slider__controls--next').attr('aria-label') || 'اسلاید بعدی';

	const availableText = $('.product__available-text').first().text().trim();
	const availableWeight = $('.product__available-weight').first().text().trim();

	const ctaHref = $('.product__cta a').first().attr('href') || null;

	const faq = {};
	$('.product-components .faq__item').each((i, el) => {
		const $el = $(el);
		const key = $el.find('.faq__answer').attr('data-san-id')?.replace('open-faq--', '') || `field-${i}`;
		const label = $el.find('.faq__question').text().trim();
		const value = $el.find('.faq__answer').text().trim();
		faq[key] = { label, value };
	});

	const benefits = $('.product-needs').map((i, el) => {
		const $el = $(el);
		return {
			icon: $el.find('.product-needs__icon img').attr('src') || null,
			iconAlt: $el.find('.product-needs__icon img').attr('alt') || null,
			description: $el.find('.product-needs__description').text().trim(),
		};
	}).get();

	const entry = {
		slug,
		sku: jsonLd?.sku || null,
		gtin13: jsonLd?.gtin13 || null,
		jsonLd: jsonLdText,
		title,
		heading,
		description,
		bodyDescription,
		ogTitle,
		ogDescription,
		canonical,
		images,
		sliderPrevLabel,
		sliderNextLabel,
		available: availableWeight ? { label: availableText, value: availableWeight } : null,
		ctaHref,
		composition: faq.Composition?.value || null,
		analyticalComponents: faq['Analytical components']?.value || null,
		additives: faq.Additives?.value || null,
		benefits,
		extraHtml,
	};

	if (!entry.title || !entry.description || images.length === 0) {
		console.warn(`WARN ${slug}: missing title/description/image`, {
			title: !!entry.title,
			description: !!entry.description,
			images: images.length,
		});
	}

	await writeFile(new URL(`${slug}.json`, OUT), JSON.stringify(entry, null, '\t') + '\n');
	ok++;
}

console.log(`Extracted ${ok} product entries → src/content/products/`);
