// Extracts src/content/blog/*.json from voskes.ir/en/blog/*.html.
//
// Unlike products, blog posts have no repeated structured fields — each is
// hand-authored freeform section markup (banners, highlight blocks, cards).
// So the collection stores the full body as HTML alongside frontmatter,
// rendered through src/pages/blog/[slug].astro with set:html rather than
// mapped field-by-field.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { rewriteEnLinks, rewriteEnUrl } from './lib/rewrite-links.mjs';

const SRC = new URL('../../voskes.ir/en/blog/', import.meta.url);
const OUT = new URL('../src/content/blog/', import.meta.url);

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith('.html'));
let ok = 0;

for (const file of files) {
	const slug = file.replace(/\.html$/, '');
	const html = await readFile(new URL(file, SRC), 'utf8');
	const $ = load(html, { xmlMode: false });

	const title = $('title').text().trim();
	const description = $('meta[name="description"]').attr('content')?.trim() || '';
	const canonical = rewriteEnUrl($('link[rel="canonical"]').attr('href') || `https://voskes.ir/en/blog/${slug}`);
	const ogTitle = $('meta[property="og:title"]').attr('content') || title;
	const ogDescription = $('meta[property="og:description"]').attr('content') || description;
	const ogImage = $('meta[property="og:image"]').attr('content') || null;

	const body = $('body > div.site #page > div.d--flex');
	const bodyHtml = rewriteEnLinks($.html(body.length ? body : $('body > div.site #page').children().first()));

	const entry = {
		slug,
		title,
		description,
		ogTitle,
		ogDescription,
		ogImage,
		canonical,
		bodyHtml,
	};

	if (!entry.title || !entry.description || !bodyHtml) {
		console.warn(`WARN ${slug}: missing title/description/body`, {
			title: !!entry.title,
			description: !!entry.description,
			bodyHtml: !!bodyHtml,
		});
	}

	await writeFile(new URL(`${slug}.json`, OUT), JSON.stringify(entry, null, '\t') + '\n');
	ok++;
}

console.log(`Extracted ${ok} blog entries → src/content/blog/`);
