// One-time patch for single-locale flattening (see DECISIONS.md): rewrites
// /en/... references already baked into src/content/{products,blog}/*.json
// from the last full extraction run. Used instead of re-running
// extract-products.mjs/extract-blog.mjs because voskes.ir/ no longer has
// the original source (see DECISIONS.md, "Mid-migration source drift,
// part 2") — patching the already-extracted JSON in place is more robust
// than round-tripping through rendered HTML.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { rewriteEnLinks, rewriteEnUrl } from './lib/rewrite-links.mjs';

async function patchDir(dirUrl, htmlField) {
	const files = (await readdir(dirUrl)).filter((f) => f.endsWith('.json'));
	let changed = 0;
	for (const file of files) {
		const fileUrl = new URL(file, dirUrl);
		const entry = JSON.parse(await readFile(fileUrl, 'utf8'));
		const before = JSON.stringify(entry);
		entry.canonical = rewriteEnUrl(entry.canonical);
		if (htmlField && entry[htmlField]) entry[htmlField] = rewriteEnLinks(entry[htmlField]);
		const after = JSON.stringify(entry);
		if (before !== after) {
			await writeFile(fileUrl, JSON.stringify(entry, null, '\t') + '\n');
			changed++;
		}
	}
	return { total: files.length, changed };
}

const products = await patchDir(new URL('../src/content/products/', import.meta.url), 'extraHtml');
console.log(`products: ${products.changed}/${products.total} patched`);

const blog = await patchDir(new URL('../src/content/blog/', import.meta.url), 'bodyHtml');
console.log(`blog: ${blog.changed}/${blog.total} patched`);
