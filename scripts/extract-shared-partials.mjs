// Extracts the shared /en/ tree partials used as Base.astro's defaults:
// header/cookie-banner/footer HTML and the three inline <style> blocks
// (root-vars, cookiebox, utility-colors). Verified byte-length-identical
// across en/index.html, en/contact.html, every product page, and every
// blog post — so any one of them is a valid source. en/index.html is used
// since it's guaranteed to exist and be representative.
//
// Single-locale flattening (see DECISIONS.md): links are rewritten to
// drop the /en/ prefix, and the language switcher (nothing left to switch
// to) is stripped from the header.
import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { rewriteEnLinks } from './lib/rewrite-links.mjs';

// voskes.nl/ was overwritten mid-session (see DECISIONS.md, "Mid-migration
// source drift, part 2") — reading from this project's own dist/ build
// output instead, verified byte-exact against the real source before that
// happened.
const SRC = new URL('../dist/en/index.html', import.meta.url);
const OUT = new URL('../src/layouts/partials/', import.meta.url);

const html = await readFile(SRC, 'utf8');
const $ = load(html, { xmlMode: false });

const rootVars = html.match(/<style>:root[\s\S]*?<\/style>/)[0].replace(/^<style>|<\/style>$/g, '');
await writeFile(new URL('root-vars.css', OUT), rootVars);

const cookieboxCss = html.match(/<style>\s*\.cookiebox \{[\s\S]*?<\/style>/)[0].replace(/^<style>\s*|<\/style>$/g, '');
await writeFile(new URL('cookiebox.css', OUT), cookieboxCss);

const utilityColors = html.match(/<style>\.bg-c--transparent[\s\S]*?<\/style>/)[0].replace(/^<style>|<\/style>$/g, '');
await writeFile(new URL('utility-colors.css', OUT), utilityColors);

$('.menu-lang').remove();
const headerHtml = rewriteEnLinks($.html($('body > div.site > div.menu')));
await writeFile(new URL('header.html', OUT), headerHtml);

const cookieBannerHtml = rewriteEnLinks($.html($('#cookie-notice')));
await writeFile(new URL('cookie-banner.html', OUT), cookieBannerHtml);

const footerHtml = rewriteEnLinks(
	$.html($('body > div.site #page > footer.footer')) + '\n' + $.html($('body > div.site #page > div.payoff'))
);
await writeFile(new URL('footer.html', OUT), footerHtml);

console.log('Wrote shared partials to src/layouts/partials/');
