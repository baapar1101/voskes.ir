import Glide from '../third_party/glide.mjs';
import * as lazyload from './lazyload.mjs';

function values(element, name) {
	const value = element.dataset[name];
	return value ? value.split(',').map((item) => item.trim()) : [];
}

export function init() {
	document.querySelectorAll('[data-js-slide]').forEach((element) => {
		const perView = values(element, 'perView');
		const breaks = values(element, 'break');
		const peekBefore = values(element, 'peekBefore');
		const peekAfter = values(element, 'peekAfter');
		const gaps = values(element, 'gap');

		const options = {
			// Keep the track's physical coordinate system LTR. The page is RTL,
			// but Glide's RTL transformer applies the opposite translation and
			// places the initial slide outside the clipped track.
			direction: 'ltr',
			hoverpause: true,
			gap: Number(gaps[0] || 0),
			type: 'carousel',
			perTouch: 5,
			perSwipe: 5,
			peek: { before: Number(peekBefore[0] || 0), after: Number(peekAfter[0] || 0) },
			perView: Number(perView[0] || 1),
		};

		if (element.dataset.autoplay) options.autoplay = Number(element.dataset.autoplay);
		if (breaks.length) {
			options.breakpoints = {};
			breaks.forEach((breakpoint, index) => {
				options.breakpoints[breakpoint] = {
					perView: Number(perView[index + 1] || perView[0] || 1),
					gap: Number(gaps[index + 1] || gaps[0] || 0),
					peek: {
						before: Number(peekBefore[index + 1] || peekBefore[0] || 0),
						after: Number(peekAfter[index + 1] || peekAfter[0] || 0),
					},
				};
			});
		}

		if (!element.id) element.id = `glide-${Math.random().toString(36).slice(2)}`;
		const track = element.querySelector('[data-glide-el="track"]');
		const slides = track?.querySelector('.glide__slides');
		if (!track || !slides || slides.children.length < 2) return;

		new Glide(`#${element.id}`, options).mount();
	});

	lazyload.initLazyLoad();
}
