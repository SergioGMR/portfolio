import type { APIRoute } from 'astro'

const staticPaths = ['/', '/acezone/tos', '/wattly/tos']

export const GET = (({ site, url }) => {
  const baseUrl = site ?? url
  const urls = staticPaths
    .map((path) => {
      const loc = new URL(path, baseUrl).toString()
      const lastmod = new Date().toISOString().split('T')[0]
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${
        path === '/' ? '1.0' : '0.8'
      }</priority></url>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}) satisfies APIRoute
