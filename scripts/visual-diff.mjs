// §6.4 visual parity gate. Requires both static servers running:
//   voskes.ir/          -> http://localhost:8100
//   astro-migration/dist -> http://localhost:8101
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = new URL('../../parity/screenshots/', import.meta.url);
await mkdir(OUT, { recursive: true });

const PAGES = [
	['/index.html', '/index.html'],
	['/en/index.html', '/en/index.html'],
	['/en/cat-food.html', '/en/cat-food.html'],
	['/en/blog.html', '/en/blog.html'],
	['/en/blog/caring.html', '/en/blog/caring.html'],
	['/en/products/adult-complete-chicken.html', '/en/products/adult-complete-chicken.html'],
	['/en/products/21339-chicken-rice-rings.html', '/en/products/21339-chicken-rice-rings.html'],
	['/en/products/beef-bone-xl.html', '/en/products/beef-bone-xl.html'], // single-image slider edge case
	['/en/contact.html', '/en/contact.html'],
];

const WIDTHS = [1440, 390];

async function settleLazyImages(page) {
	await page.evaluate(async () => {
		const distance = 400;
		for (let y = 0; y < document.body.scrollHeight; y += distance) {
			window.scrollTo(0, y);
			await new Promise((r) => setTimeout(r, 60));
		}
		window.scrollTo(0, 0);
	});
	await page.waitForTimeout(300);
}

const browser = await chromium.launch();
const results = [];

for (const width of WIDTHS) {
	const context = await browser.newContext({ viewport: { width, height: 1200 } });
	const page = await context.newPage();

	for (const [srcPath, astroPath] of PAGES) {
		const slug = srcPath.replace(/^\//, '').replace(/[\/.]/g, '_');

		await page.goto(`http://localhost:8100${srcPath}`, { waitUntil: 'networkidle' });
		await settleLazyImages(page);
		const srcOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
		const srcBuf = await page.screenshot({ fullPage: true });

		await page.goto(`http://localhost:8101${astroPath}`, { waitUntil: 'networkidle' });
		await settleLazyImages(page);
		const astroOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
		const astroFont = await page.evaluate(() => {
			const h1 = document.querySelector('h1, .banner__title, .product__headings h1');
			return h1 ? getComputedStyle(h1).fontFamily : null;
		});
		const astroBuf = await page.screenshot({ fullPage: true });

		const srcPng = PNG.sync.read(srcBuf);
		const astroPng = PNG.sync.read(astroBuf);
		const w = Math.max(srcPng.width, astroPng.width);
		const h = Math.max(srcPng.height, astroPng.height);

		function resize(png) {
			if (png.width === w && png.height === h) return png;
			const out = new PNG({ width: w, height: h });
			PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
			return out;
		}
		const a = resize(srcPng);
		const b = resize(astroPng);
		const diff = new PNG({ width: w, height: h });
		const diffPixels = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.15 });
		const diffRatio = diffPixels / (w * h);

		await writeFile(new URL(`${slug}-${width}-source.png`, OUT), srcBuf);
		await writeFile(new URL(`${slug}-${width}-astro.png`, OUT), astroBuf);
		await writeFile(new URL(`${slug}-${width}-diff.png`, OUT), PNG.sync.write(diff));

		results.push({
			path: srcPath,
			width,
			srcOverflow,
			astroOverflow,
			astroFont,
			diffPixels,
			diffRatio: +diffRatio.toFixed(4),
			srcDims: `${srcPng.width}x${srcPng.height}`,
			astroDims: `${astroPng.width}x${astroPng.height}`,
		});
	}
	await context.close();
}

// Interaction smoke tests on the Astro build only.
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.setViewportSize({ width: 390, height: 900 });
await page.goto('http://localhost:8101/en/index.html', { waitUntil: 'networkidle' });

const interactions = {};

// hamburger menu opens the nav (JS toggles .expanded on .menu-bar)
await page.click('#toggle-menu');
await page.waitForTimeout(300);
interactions.hamburgerOpensNav = await page.evaluate(() => document.querySelector('.menu-bar')?.classList.contains('expanded'));

// cookie banner customize toggle
const cookieShown = await page.evaluate(() => getComputedStyle(document.getElementById('cookie-notice')).display !== 'none');
interactions.cookieBannerVisible = cookieShown;
if (cookieShown) {
	await page.click('[data-j-id="cookies-config"]');
	await page.waitForTimeout(200);
	interactions.cookieConfigOpens = await page.evaluate(() => getComputedStyle(document.querySelector('.cookiebox__config')).display !== 'none');
}

await page.close();

// Glide slider arrow direction on a product page (desktop width, arrows only show <lg per CSS but data-glide-dir attrs are what matters)
const page2 = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page2.goto('http://localhost:8101/en/products/adult-complete-chicken.html', { waitUntil: 'networkidle' });
interactions.glideDirAttrsPresent = await page2.evaluate(() => {
	const prev = document.querySelector('[data-glide-dir="<"]');
	const next = document.querySelector('[data-glide-dir=">"]');
	return !!prev && !!next;
});
await page2.close();

await browser.close();

console.log(JSON.stringify({ results, interactions }, null, 2));

const overflowFails = results.filter((r) => r.width === 390 && r.astroOverflow && !r.srcOverflow);
const bigDiffs = results.filter((r) => r.diffRatio > 0.05);

console.log('\n--- Summary ---');
console.log('New horizontal overflow at 390px (astro only, src ok):', overflowFails.length);
overflowFails.forEach((r) => console.log('  ', r.path, r.width));
console.log('Pages with >5% pixel diff:', bigDiffs.length);
bigDiffs.forEach((r) => console.log('  ', r.path, r.width, r.diffRatio));
console.log('Interactions:', interactions);
