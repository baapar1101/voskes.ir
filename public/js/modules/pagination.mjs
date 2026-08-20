const PAGE_SIZE = 20;

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
		const cards = [...document.querySelectorAll('.products-grid > .product-card__link')];
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
