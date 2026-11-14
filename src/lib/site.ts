import type { Language } from './language-client'

export const SITE_URL = 'https://sgmr.dev'
export const CASE_STUDY_IDS = [
  'jauntjar',
  'todo-lux',
  'basuraleza',
  'wattly',
  'tvradar',
  'duellum',
  'uploadimg',
  'uploadimg-desktop',
] as const

export const INDEXABLE_PATHS = [
  '/',
  '/en',
  '/acezone/tos',
  '/en/acezone/tos',
  '/wattly/tos',
  '/en/wattly/tos',
  ...CASE_STUDY_IDS.flatMap(
    (id) => [`/proyectos/${id}`, `/en/projects/${id}`] as const,
  ),
] as const

export type IndexablePath = (typeof INDEXABLE_PATHS)[number]

/**
 * Last content change per indexable page (`YYYY-MM-DD`). Terms pages keep the
 * date of their last legal-text change (2026-10-11); later commits only
 * restyled them. The home and case-study pages use the index redesign date
 * (2026-11-14), which changed their sections and added previous/next links
 * between case studies.
 * These dates are maintained by hand: update the entry whenever a page's
 * content or links change. Typed as a record over `IndexablePath`, so adding or removing an indexable
 * path without updating this map fails type checking.
 */
export const PAGE_LAST_MODIFIED: Record<IndexablePath, string> = {
  '/': '2026-11-14',
  '/en': '2026-11-14',
  '/acezone/tos': '2026-10-11',
  '/en/acezone/tos': '2026-10-11',
  '/wattly/tos': '2026-10-11',
  '/en/wattly/tos': '2026-10-11',
  '/proyectos/jauntjar': '2026-11-14',
  '/en/projects/jauntjar': '2026-11-14',
  '/proyectos/todo-lux': '2026-11-14',
  '/en/projects/todo-lux': '2026-11-14',
  '/proyectos/basuraleza': '2026-11-14',
  '/en/projects/basuraleza': '2026-11-14',
  '/proyectos/wattly': '2026-11-14',
  '/en/projects/wattly': '2026-11-14',
  '/proyectos/tvradar': '2026-11-14',
  '/en/projects/tvradar': '2026-11-14',
  '/proyectos/duellum': '2026-11-14',
  '/en/projects/duellum': '2026-11-14',
  '/proyectos/uploadimg': '2026-11-14',
  '/en/projects/uploadimg': '2026-11-14',
  '/proyectos/uploadimg-desktop': '2026-11-14',
  '/en/projects/uploadimg-desktop': '2026-11-14',
}

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
    return `  <url><loc>${location}</loc><lastmod>${PAGE_LAST_MODIFIED[path]}</lastmod></url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
