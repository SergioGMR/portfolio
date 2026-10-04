export const SITE_URL = 'https://sgmr.dev'

export const INDEXABLE_PATHS = ['/', '/acezone/tos', '/wattly/tos'] as const

export function createSitemapXml(site: string | URL = SITE_URL): string {
  const urls = INDEXABLE_PATHS.map((path) => {
    const location = new URL(path, site).toString()
    const priority = path === '/' ? '1.0' : '0.8'

    return `  <url><loc>${location}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
