import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lorabiz.com';

  // These are all your public-facing landing and service pages
  const routes = [
    '',
    '/about',
    '/contact',
    '/careers',
    '/blog',
    '/faq',
    '/contact',
    '/services/cac',
    '/services/scuml',
    '/services/tax-id',
    '/services/nin',
    '/services/utilities',
    '/privacy',
    '/terms',
    '/acceptance-use',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}