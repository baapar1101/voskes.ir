// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://voskes.nl',
	trailingSlash: 'never',
	build: {
		format: 'preserve',
	},
});
