const PAGE_SIZE = 18;

const CAT_SLUGS = new Set([
	'adult-complete-chicken', 'adult-complete-salmon', 'adult-sterilized-salmon',
	'adult-sterilzed-chicken', 'biscuits-with-bonito', 'biscuits-with-chicken-and-catnip',
	'biscuits-with-tuna', 'chicken-sandwiches', 'chicken-strips', 'chicken-sushi-rolls-60gr',
	'dried-fish', 'duck-fillet-hearts', 'duck-sushi-rolls', 'jelly-chicken-with-vegetables',
	'jelly-chicken', 'jelly-cups-tuna-and-chicken', 'jelly-cups-tuna-and-crab',
	'jelly-cups-tuna-and-scallop', 'jelly-cups-tuna-and-shrimps', 'jelly-cups-tuna',
	'jelly-sardine', 'jelly-tuna-with-beef', 'jelly-tuna-with-chicken',
	'jelly-tuna-with-dentex', 'jelly-tuna-with-grouper', 'jelly-tuna-with-pumpkin',
	'jelly-tuna-with-quinoa', 'jelly-tuna-with-salmon', 'jelly-tuna-with-seabass',
	'jelly-tuna-with-seabream', 'jelly-tuna-with-shirasu', 'jelly-tuna-with-shrimp',
	'jelly-tuna-with-squid', 'jelly-tuna-with-yellowtail', 'jelly-tuna',
	'kitten-complete-chicken', 'kitten-pate-chicken-with-carrots-1', 'liquid-treat-chicken',
	'liquid-treat-mackeral', 'liquid-treat-salmon', 'liquid-treat-tuna',
	'mousse-with-flakes-chicken', 'mousse-with-flakes-mackeral-and-chicken',
	'mousse-with-flakes-tuna-and-chicken', 'mousse-with-sauce-chicken',
	'mousse-with-sauce-fish', 'pate-hake-with-salmon-and-peas',
	'pate-iberian-pork-with-turkey-and-pumpkin', 'pate-tuna-with-cod-and-green-beans',
	'pate-turkey-with-chicken-and-pumpkin', 'pate-with-chicken-and-beef',
	'pate-with-chicken-and-fish', 'pate-with-chicken-and-lamb', 'pate-with-chicken',
	'pate-with-tuna', 'soup-with-beef', 'soup-with-chicken', 'soup-with-salmon',
	'soup-with-tuna', 'triple-layer-with-beef-surimi-and-pumpkin', 'cream-with-chicken-90gr',
	'cream-with-tuna-and-beef', 'cream-with-tuna-and-mackeral',
]);

function categoryForPath() {
	const path = window.location.pathname;
	if (path === '/cat' || path === '/cat-food' || path === '/cat-treats') return 'cat';
	if (path === '/dog-treats') return 'dog';
	return null;
}

function updatePagination(currentPage) {
	const pagination = document.querySelector('.pages');
	if (!pagination) return;

	pagination.querySelectorAll('a.pages__link').forEach((link) => {
		const url = new URL(link.href, window.location.origin);
		const page = Number(url.searchParams.get('p') || 1);
		link.classList.toggle('pages__link--active', page === currentPage);
	});
}

async function loadPageFromStore(page) {
	const grid = document.querySelector('.products-grid');
	if (!grid || page <= 1) return;

	try {
		const response = await fetch('/products', { headers: { Accept: 'text/html' } });
		if (!response.ok) return;
		const html = await response.text();
		const document = new DOMParser().parseFromString(html, 'text/html');
		let cards = [...document.querySelectorAll('.products-grid > .product-card__link')];
		const category = categoryForPath();
		if (category) {
			cards = cards.filter((card) => {
				const slug = new URL(card.href, window.location.origin).pathname.split('/').filter(Boolean).pop();
				const isCat = CAT_SLUGS.has(slug);
				return category === 'cat' ? isCat : !isCat;
			});
		}
		const pageCards = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
		if (!pageCards.length) return;
		grid.replaceChildren(...pageCards.map((card) => card.cloneNode(true)));
	} catch {
		// Keep the server-rendered first page if the store cannot be fetched.
	}
}

const page = Number(new URLSearchParams(window.location.search).get('p') || 1);
updatePagination(page);
loadPageFromStore(page);
