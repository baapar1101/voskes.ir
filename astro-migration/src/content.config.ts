import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/products' }),
	schema: z.object({
		slug: z.string(),
		sku: z.string().nullable(),
		gtin13: z.string().nullable(),
		jsonLd: z.string().nullable(),
		title: z.string(),
		heading: z.string(),
		description: z.string(),
		bodyDescription: z.string().nullable(),
		ogTitle: z.string(),
		ogDescription: z.string(),
		canonical: z.string(),
		images: z.array(z.object({ src: z.string(), alt: z.string() })),
		sliderPrevLabel: z.string(),
		sliderNextLabel: z.string(),
		available: z.object({ label: z.string(), value: z.string() }).nullable(),
		ctaHref: z.string().nullable(),
		composition: z.string().nullable(),
		analyticalComponents: z.string().nullable(),
		additives: z.string().nullable(),
		benefits: z.array(
			z.object({
				icon: z.string().nullable(),
				iconAlt: z.string().nullable(),
				description: z.string(),
			})
		),
		extraHtml: z.string().nullable(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/blog' }),
	schema: z.object({
		slug: z.string(),
		title: z.string(),
		description: z.string(),
		ogTitle: z.string(),
		ogDescription: z.string(),
		ogImage: z.string().nullable(),
		canonical: z.string(),
		bodyHtml: z.string(),
	}),
});

export const collections = { products, blog };
