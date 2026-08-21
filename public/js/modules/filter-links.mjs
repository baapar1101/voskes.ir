const routeMap = {
	'/cat': {
		'n=complete_dry_food': '/cat-food/complete-dry-food',
		'n=complete_wet_food': '/cat-food/complete-wet-food',
		'n=additional_wet_food': '/cat-food/complementary-wet-food',
		's=drinks': '/cat-treats/drinks',
		's=creams': '/cat-treats/creams',
		's=jelly_cups': '/cat-treats/jelly-cups',
	},
	'/cat-food': {
		'n=complete_dry_food': '/cat-food/complete-dry-food',
		'n=complete_wet_food': '/cat-food/complete-wet-food',
		'n=additional_wet_food': '/cat-food/complementary-wet-food',
	},
	'/cat-treats': {
		's=drinks': '/cat-treats/drinks',
		's=creams': '/cat-treats/creams',
		's=jelly_cups': '/cat-treats/jelly-cups',
	},
	'/dog-treats': {
		'c=training_cookies': '/dog-treats/training-treats',
		'c=dog_cookies': '/dog-treats/biscuits',
	},
};

const path = window.location.pathname;
const mappings = routeMap[path];
if (mappings) {
	document.querySelectorAll('a.filters__item, a.filterCategory').forEach((link) => {
		const url = new URL(link.href, window.location.origin);
		const key = [...url.searchParams.entries()]
			.filter(([name]) => name !== 'p')
			.map(([name, value]) => `${name}=${value}`)
			.join('&');
		const target = mappings[key];
		if (target) link.href = `${target}#products-${path.startsWith('/dog') ? 'dog' : 'cat'}`;
	});
}
