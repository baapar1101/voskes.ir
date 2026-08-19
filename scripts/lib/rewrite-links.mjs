// The migration originally preserved the source's /en/... prefix on every
// route (see DECISIONS.md §3.1). Per a later decision (DECISIONS.md
// "Single-locale flattening"), the Dutch root page and the NL/DE/FR
// language switcher were dropped and the /en/ tree became the site root.
// This rewrites every internal reference accordingly. Safe to run
// idempotently — a string with no /en/ references passes through unchanged.
export function rewriteEnLinks(html) {
	if (!html) return html;
	return html
		.replace(/(href|src|action|value)="\/en\//g, '$1="/')
		.replace(/(href|src|action|value)="\/en"/g, '$1="/"')
		.replace(/(href|src|action|value)="\/en#/g, '$1="/#')
		.replace(/(href|src|action|value)="\/en\?/g, '$1="/?')
		.replace(/https:\/\/voskes\.nl\/en\//g, 'https://voskes.ir/')
		.replace(/https:\/\/voskes\.nl\/en"/g, 'https://voskes.ir/"');
}

// Strips the /en/ segment from an absolute or root-relative URL string
// (canonical, og:url, ctaHref-style single-URL fields — not HTML blobs).
export function rewriteEnUrl(url) {
	if (!url) return url;
	return url.replace('https://voskes.ir/en/', 'https://voskes.ir/').replace(/^\/en\//, '/').replace(/^\/en$/, '/');
}
