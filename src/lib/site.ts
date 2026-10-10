import type { Language } from './language-client'

export const SITE_URL = 'https://sgmr.dev'
export const CASE_STUDY_IDS = ['jauntjar', 'todo-lux', 'basuraleza'] as const

export const INDEXABLE_PATHS = [
  '/',
  '/en',
  '/acezone/tos',
  '/en/acezone/tos',
  '/wattly/tos',
  '/en/wattly/tos',
  ...CASE_STUDY_IDS.flatMap((id) => [`/proyectos/${id}`, `/en/projects/${id}`]),
] as const

export function getLanguage(path: string): Language {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'es'
}

export function getAlternatePaths(path: string): Record<Language, string> {
  const normalized = path.replace(/\/+$/, '') || '/'
  const spanish =
    normalized === '/en'
      ? '/'
      : normalized
          .replace(/^\/en(?=\/)/, '')
          .replace(/^\/projects\//, '/proyectos/')
  const english =
    spanish === '/'
      ? '/en'
      : `/en${spanish.replace(/^\/proyectos\//, '/projects/')}`
  return { es: spanish, en: english }
}

export function createSitemapXml(site: string | URL = SITE_URL): string {
  const urls = INDEXABLE_PATHS.map((path) => {
    const location = new URL(path, site).toString()
    const priority = path === '/' || path === '/en' ? '1.0' : '0.8'
    return `  <url><loc>${location}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
