import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lorabiz.com';

  const routes: {
    path: string;
    priority: number;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/services/cac', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/services/cac/annual-returns', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/services/scuml', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/services/tax-id', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/services/nin', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/services/utilities', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/blog/how-to-file-cac-annual-returns-nigeria', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/compliance', priority: 0.75, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/acceptable-use', priority: 0.5, changeFrequency: 'monthly' },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

