import type { APIRoute } from 'astro'
import { SITE_URL, createSitemapXml } from '../lib/site'

export const GET: APIRoute = ({ site }) =>
  new Response(createSitemapXml(site ?? SITE_URL), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
