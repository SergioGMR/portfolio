import { createHash, randomUUID } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'

import {
  INDEXABLE_PATHS,
  PAGE_LAST_MODIFIED,
  getLanguage,
  getAlternatePaths,
  type IndexablePath,
} from '../src/lib/site'
import {
  PAGE_METADATA,
  createCaseStudyMetadata,
  PERSON_ID,
} from '../src/lib/page-metadata'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

// Independent acceptance boundary: changing the site's config must not silently
// redefine which origin the output verifier accepts.
const EXPECTED_SITE_URL = 'https://sgmr.dev'
const defaultRootUrl = new URL('../', import.meta.url)

const canonicalPdfSha256 = {
  es: '9dcc01b4a761ba98b88fc16ab49e2c84d27c8384002945417b8dd570af343cc9',
  en: 'f3ca1cf2451eab873cd07aed7d93441e1805ddbd13dbb453936d824f54f8af76',
} as const

const expectedSitemapLocations = INDEXABLE_PATHS.map((path) =>
  new URL(path, EXPECTED_SITE_URL).toString(),
)
const expectedSitemapLastModified = INDEXABLE_PATHS.map(
  (path) => PAGE_LAST_MODIFIED[path],
)

type StructuredData = Record<string, unknown>

interface HtmlDocumentStructure {
  doctypeNames: string[]
  htmlCount: number
  headCount: number
  validHeadCount: number
  bodyCount: number
  validBodyCount: number
}

interface HtmlSnapshot extends HtmlDocumentStructure {
  titles: string[]
  descriptionContents: string[]
  canonicalHrefs: string[]
  openGraphContents: Record<string, string[]>
  structuredData: unknown[]
  localizedLanguages: string[]
  localizedText: Record<'es' | 'en', string>
  localizedHrefs: Record<'es' | 'en', string[]>
  hrefs: string[]
  activeText: string
  language: string
  h1Count: number
  headingLevels: number[]
  ids: string[]
  alternates: Record<string, string[]>
  robots: string[]
  googlebot: string[]
  twitterMeta: Record<string, string[]>
  twitterPropertyMeta: string[]
  icons: {
    rel: string
    href: string
    sizes: string | null
    type: string | null
  }[]
  languageLinks: { href: string; current: string | null; language: string }[]
}

interface SitemapElement {
  name: string
  text: string
  directLocationCount: number
  directLastModifiedCount: number
}

interface SitemapSnapshot {
  locations: string[]
  lastModified: string[]
  urlLocationCounts: number[]
  urlLastModifiedCounts: number[]
}

function assertIncludes(value: string, expected: string, label: string): void {
  if (!value.includes(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}`)
  }
}

function assertExcludes(value: string, forbidden: string, label: string): void {
  if (value.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`${label}: found ${JSON.stringify(forbidden)}`)
  }
}

function assertSingleValue(
  values: string[],
  expected: string,
  label: string,
): void {
  if (values.length !== 1 || values[0] !== expected) {
    throw new Error(
      `${label}: expected one active value ${JSON.stringify(expected)}, got ${JSON.stringify(values)}`,
    )
  }
}

function assertCanonicalPdf(
  label: string,
  pdf: Buffer,
  expectedSha256: string,
): void {
  if (pdf.byteLength < 1024) {
    throw new Error(`${label}: PDF is too small (${pdf.byteLength} bytes)`)
  }

  if (pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error(`${label}: missing %PDF- header`)
  }

  const actualSha256 = createHash('sha256').update(pdf).digest('hex')
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `${label}: SHA-256 mismatch; expected ${expectedSha256}, got ${actualSha256}`,
    )
  }
}

async function pathExists(url: URL): Promise<boolean> {
  try {
    await access(url)
    return true
  } catch {
    return false
  }
}

async function readRequiredArtifact(
  rootUrl: URL,
  artifactPath: string,
  label: string,
): Promise<Buffer> {
  try {
    return await readFile(new URL(artifactPath, rootUrl))
  } catch {
    throw new Error(`${label}: missing emitted artifact ${artifactPath}`)
  }
}

const PNG_SIGNATURE = '89504e470d0a1a0a'

function readPngSize(bytes: Buffer, label: string) {
  if (
    bytes.byteLength < 24 ||
    bytes.subarray(0, 8).toString('hex') !== PNG_SIGNATURE ||
    bytes.subarray(12, 16).toString('ascii') !== 'IHDR'
  )
    throw new Error(`${label}: not a valid PNG`)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

function readWebpSize(bytes: Buffer, label: string) {
  if (
    bytes.byteLength < 30 ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WEBP'
  )
    throw new Error(`${label}: not a valid WebP (missing RIFF/WEBP header)`)
  const chunk = bytes.subarray(12, 16).toString('ascii')
  if (chunk === 'VP8X')
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    }
  if (chunk === 'VP8L') {
    const bits = bytes.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8 ')
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    }
  throw new Error(`${label}: unsupported WebP chunk ${JSON.stringify(chunk)}`)
}

function readIcoSize(bytes: Buffer, label: string) {
  if (
    bytes.byteLength < 22 ||
    bytes.readUInt16LE(0) !== 0 ||
    bytes.readUInt16LE(2) !== 1 ||
    bytes.readUInt16LE(4) < 1
  )
    throw new Error(`${label}: not a valid ICO`)
  // A width or height byte of 0 means 256 in the ICO directory.
  return { width: bytes[6] || 256, height: bytes[7] || 256 }
}

async function verifyIdentityAssets(rootUrl: URL): Promise<void> {
  for (const [file, size] of [
    ['favicon-96x96.png', 96],
    ['apple-touch-icon.png', 180],
    ['sergio-morales-avatar.png', 500],
  ] as const) {
    const actual = readPngSize(
      await readRequiredArtifact(rootUrl, `dist/${file}`, file),
      file,
    )
    if (actual.width !== size || actual.height !== size)
      throw new Error(
        `${file}: expected ${size}x${size}, got ${actual.width}x${actual.height}`,
      )
  }
  const ico = await readRequiredArtifact(
    rootUrl,
    'dist/favicon.ico',
    'favicon.ico',
  )
  const { width, height } = readIcoSize(ico, 'favicon.ico')
  if (width !== 32 || height !== 32)
    throw new Error(`favicon.ico: expected 32x32, got ${width}x${height}`)
}

async function verifySitemapRouteArtifacts(rootUrl: URL): Promise<void> {
  const snapshots = new Map<string, HtmlSnapshot>()
  for (const location of expectedSitemapLocations) {
    const pathname = new URL(location).pathname
    const relativeArtifact =
      pathname === '/' ? 'index.html' : `${pathname.slice(1)}/index.html`
    const artifactPath = `dist/${relativeArtifact}`
    const artifact = await readRequiredArtifact(
      rootUrl,
      artifactPath,
      'sitemap route artifact',
    )
    const snapshot = await createHtmlSnapshot(artifact.toString('utf8'))
    if (!hasValidHtmlDocumentStructure(snapshot))
      throw new Error(
        `sitemap route artifact: expected emitted HTML at ${artifactPath}`,
      )
    await verifyPageOutput(artifact.toString('utf8'), pathname, rootUrl)
    snapshots.set(pathname, snapshot)
    const vercelArtifact = await readRequiredArtifact(
      rootUrl,
      `.vercel/output/static/${relativeArtifact}`,
      'Vercel static route artifact',
    )
    if (!artifact.equals(vercelArtifact))
      throw new Error(
        `Vercel static route artifact: differs from ${artifactPath}`,
      )
  }
  for (const [pathname, snapshot] of snapshots) {
    for (const href of snapshot.hrefs) {
      const target = new URL(href, new URL(pathname, EXPECTED_SITE_URL))
      if (target.origin !== EXPECTED_SITE_URL) continue
      const page = snapshots.get(target.pathname)
      if (page) {
        if (
          target.hash &&
          !page.ids.includes(decodeURIComponent(target.hash.slice(1)))
        )
          throw new Error(
            `internal navigation: ${pathname} -> ${href} missing section`,
          )
      } else if (
        /\.(?:pdf|avif|jpg|png|webp|css|js|woff2)$/.test(target.pathname)
      ) {
        await readRequiredArtifact(
          rootUrl,
          `dist${target.pathname}`,
          'internal navigation asset',
        )
      } else {
        throw new Error(
          `internal navigation: ${pathname} -> ${href} missing page`,
        )
      }
    }
  }
}

function isStructuredData(value: unknown): value is StructuredData {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function findPeople(value: unknown): StructuredData[] {
  if (Array.isArray(value)) {
    return value.flatMap(findPeople)
  }

  if (!isStructuredData(value)) {
    return []
  }

  const type = value['@type']
  const isPerson =
    type === 'Person' || (Array.isArray(type) && type.includes('Person'))
  const nestedPeople = Object.values(value).flatMap(findPeople)

  return isPerson ? [value, ...nestedPeople] : nestedPeople
}

function normalizeHrefForComparison(href: string): string {
  try {
    return decodeURIComponent(href).toLowerCase()
  } catch {
    return href.toLowerCase()
  }
}

function hasValidHtmlDocumentStructure(
  structure: HtmlDocumentStructure,
): boolean {
  return (
    structure.doctypeNames.length === 1 &&
    structure.doctypeNames[0]?.toLowerCase() === 'html' &&
    structure.htmlCount === 1 &&
    structure.headCount === 1 &&
    structure.validHeadCount === 1 &&
    structure.bodyCount === 1 &&
    structure.validBodyCount === 1
  )
}

async function createHtmlSnapshot(indexHtml: string): Promise<HtmlSnapshot> {
  const doctypeNames: string[] = []
  const titles: string[] = []
  const descriptionContents: string[] = []
  const canonicalHrefs: string[] = []
  const openGraphContents: Record<string, string[]> = {}
  const structuredDataSources: string[] = []
  const localizedLanguages: string[] = []
  const localizedTextParts: Record<'es' | 'en', string[]> = {
    es: [],
    en: [],
  }
  const localizedHrefs: Record<'es' | 'en', string[]> = {
    es: [],
    en: [],
  }
  const hrefs: string[] = []
  const activeTextParts: string[] = []

  const ids: string[] = []
  let language = ''
  let h1Count = 0
  const headingLevels: number[] = []
  const alternates: Record<string, string[]> = {}
  const robots: string[] = []
  const googlebot: string[] = []
  const twitterMeta: Record<string, string[]> = {}
  const twitterPropertyMeta: string[] = []
  const icons: HtmlSnapshot['icons'] = []
  const languageLinks: HtmlSnapshot['languageLinks'] = []

  let inertDepth = 0
  let validHeadDepth = 0
  let htmlCount = 0
  let headCount = 0
  let validHeadCount = 0
  let bodyCount = 0
  let validBodyCount = 0
  let bodySeen = false
  let activeTitle: string | undefined
  let activeStructuredData: string | undefined
  let activeLanguage: 'es' | 'en' | undefined

  const rewriter = new HTMLRewriter()
    .on('template, noscript, style', {
      element(element) {
        inertDepth += 1
        element.onEndTag(() => {
          inertDepth -= 1
        })
      },
    })
    .on('html', {
      element(element) {
        if (inertDepth === 0) {
          htmlCount += 1
          language = element.getAttribute('lang') ?? ''
        }
      },
    })
    .on('body', {
      element() {
        if (inertDepth === 0) {
          bodyCount += 1
          bodySeen = true
        }
      },
    })
    .on('html > body', {
      element() {
        if (inertDepth === 0) {
          validBodyCount += 1
        }
      },
    })
    .on('head', {
      element() {
        if (inertDepth === 0) {
          headCount += 1
        }
      },
    })
    .on('html > head', {
      element(element) {
        if (inertDepth > 0 || bodySeen) {
          return
        }

        validHeadCount += 1
        validHeadDepth += 1
        element.onEndTag(() => {
          validHeadDepth -= 1
        })
      },
    })
    .on('title', {
      element(element) {
        if (inertDepth > 0 || validHeadDepth === 0) {
          return
        }

        activeTitle = ''
        element.onEndTag(() => {
          titles.push(activeTitle ?? '')
          activeTitle = undefined
        })
      },
      text(text) {
        if (activeTitle !== undefined) {
          activeTitle += text.text
        }
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0) {
          descriptionContents.push(element.getAttribute('content') ?? '')
        }
      },
    })
    .on('link[rel="canonical"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0) {
          canonicalHrefs.push(element.getAttribute('href') ?? '')
        }
      },
    })
    .on('meta[property^="og:"]', {
      element(element) {
        if (inertDepth > 0 || validHeadDepth === 0) {
          return
        }

        const property = element.getAttribute('property') ?? ''
        const values = openGraphContents[property] ?? []
        values.push(element.getAttribute('content') ?? '')
        openGraphContents[property] = values
      },
    })
    .on('[id]', {
      element(element) {
        if (inertDepth === 0) ids.push(element.getAttribute('id') ?? '')
      },
    })
    .on('h1', {
      element() {
        if (inertDepth === 0) h1Count += 1
      },
    })
    .on('h1, h2, h3, h4, h5, h6', {
      element(element) {
        if (inertDepth === 0)
          headingLevels.push(Number(element.tagName.slice(1)))
      },
    })
    .on('link[rel="alternate"][hreflang]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0) {
          const lang = element.getAttribute('hreflang') ?? ''
          ;(alternates[lang] ??= []).push(element.getAttribute('href') ?? '')
        }
      },
    })
    .on('meta[name="robots"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0)
          robots.push(element.getAttribute('content') ?? '')
      },
    })
    .on('meta[name="googlebot"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0)
          googlebot.push(element.getAttribute('content') ?? '')
      },
    })
    .on('meta[name^="twitter:"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0)
          (twitterMeta[element.getAttribute('name') ?? ''] ??= []).push(
            element.getAttribute('content') ?? '',
          )
      },
    })
    .on('meta[property^="twitter:"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0)
          twitterPropertyMeta.push(element.getAttribute('property') ?? '')
      },
    })
    .on('link[rel="icon"], link[rel="apple-touch-icon"]', {
      element(element) {
        if (inertDepth === 0 && validHeadDepth > 0)
          icons.push({
            rel: element.getAttribute('rel') ?? '',
            href: element.getAttribute('href') ?? '',
            sizes: element.getAttribute('sizes'),
            type: element.getAttribute('type'),
          })
      },
    })
    .on('a[data-language-link]', {
      element(element) {
        if (inertDepth === 0)
          languageLinks.push({
            href: element.getAttribute('href') ?? '',
            current: element.getAttribute('aria-current'),
            language: element.getAttribute('hreflang') ?? '',
          })
      },
    })
    .on('script', {
      element(element) {
        const isActiveStructuredData =
          inertDepth === 0 &&
          element.getAttribute('type') === 'application/ld+json'
        inertDepth += 1
        if (isActiveStructuredData) {
          activeStructuredData = ''
        }

        element.onEndTag(() => {
          if (isActiveStructuredData) {
            structuredDataSources.push(activeStructuredData ?? '')
            activeStructuredData = undefined
          }
          inertDepth -= 1
        })
      },
      text(text) {
        if (activeStructuredData !== undefined) {
          activeStructuredData += text.text
        }
      },
    })
    .on('*[data-lang-content]', {
      element(element) {
        if (inertDepth > 0) {
          return
        }

        const language = element.getAttribute('data-lang-content')
        localizedLanguages.push(language ?? '')
        if (language !== 'es' && language !== 'en') {
          return
        }

        const previousLanguage = activeLanguage
        activeLanguage = language
        element.onEndTag(() => {
          activeLanguage = previousLanguage
        })
      },
    })
    .on('a[href]', {
      element(element) {
        if (inertDepth === 0) {
          const href = element.getAttribute('href') ?? ''
          hrefs.push(href)
          if (activeLanguage !== undefined) {
            localizedHrefs[activeLanguage].push(href)
          }
        }
      },
    })
    .onDocument({
      doctype(doctype) {
        doctypeNames.push(doctype.name ?? '')
      },
      text(text) {
        if (inertDepth === 0) {
          activeTextParts.push(text.text)
          if (activeLanguage !== undefined) {
            localizedTextParts[activeLanguage].push(text.text)
          }
        }
      },
    })

  await rewriter.transform(new Response(indexHtml)).text()

  const structuredData = structuredDataSources.map((source) => {
    try {
      return JSON.parse(source) as unknown
    } catch {
      throw new Error('Person structured data: invalid JSON-LD')
    }
  })

  return {
    language,
    h1Count,
    headingLevels,
    ids,
    alternates,
    robots,
    googlebot,
    twitterMeta,
    twitterPropertyMeta,
    icons,
    languageLinks,
    doctypeNames,
    htmlCount,
    headCount,
    validHeadCount,
    bodyCount,
    validBodyCount,
    titles,
    descriptionContents,
    canonicalHrefs,
    openGraphContents,
    structuredData,
    localizedLanguages,
    localizedText: {
      es: localizedTextParts.es.join(''),
      en: localizedTextParts.en.join(''),
    },
    localizedHrefs,
    hrefs,
    activeText: activeTextParts.join(''),
  }
}

export async function verifyHtmlOutput(
  indexHtml: string,
  language: 'es' | 'en' = 'es',
): Promise<void> {
  const snapshot = await createHtmlSnapshot(indexHtml)
  const expectedTitle = PAGE_METADATA.home[language].title
  const expectedDescription = PAGE_METADATA.home[language].description
  const expectedCanonicalUrl = new URL(
    language === 'es' ? '/' : '/en',
    EXPECTED_SITE_URL,
  ).toString()

  if (snapshot.headCount !== 1 || snapshot.validHeadCount !== 1) {
    throw new Error(
      `document head: expected one active direct head before body, found ${snapshot.headCount} head elements and ${snapshot.validHeadCount} valid heads`,
    )
  }

  if (
    snapshot.titles.length !== 1 ||
    snapshot.titles[0]?.trim() !== expectedTitle
  ) {
    throw new Error(
      `page title: expected one active title ${JSON.stringify(expectedTitle)}, got ${JSON.stringify(snapshot.titles)}`,
    )
  }

  assertSingleValue(
    snapshot.descriptionContents,
    expectedDescription,
    'meta description',
  )
  assertSingleValue(
    snapshot.canonicalHrefs,
    expectedCanonicalUrl,
    'canonical link',
  )

  for (const [property, expected, label] of [
    ['og:type', 'website', 'Open Graph type'],
    ['og:url', expectedCanonicalUrl, 'Open Graph URL'],
    ['og:title', expectedTitle, 'Open Graph title'],
    ['og:description', expectedDescription, 'Open Graph description'],
    ['og:image', 'https://sgmr.dev/og.jpg', 'Open Graph image'],
  ] as const) {
    assertSingleValue(
      snapshot.openGraphContents[property] ?? [],
      expected,
      label,
    )
  }

  for (const [property, values] of Object.entries(snapshot.openGraphContents)) {
    if (values.length !== 1) {
      throw new Error(
        `Open Graph ${property}: expected one active value, got ${JSON.stringify(values)}`,
      )
    }
  }

  const people = snapshot.structuredData.flatMap(findPeople)
  if (people.length === 0) {
    throw new Error('Person structured data: expected an active Person node')
  }
  if (!people.some((person) => person.jobTitle === 'Tech Lead Full Stack')) {
    throw new Error(
      'Person job title: expected an active Person with jobTitle "Tech Lead Full Stack"',
    )
  }

  if (!snapshot.localizedLanguages.includes(language)) {
    throw new Error(
      `${language} localization: expected active localized content`,
    )
  }
  if (snapshot.localizedLanguages.some((value) => value !== language)) {
    throw new Error('URL locale: unexpected other-language content')
  }
  const educationLine = 'I.E.S. El Rincón · 2016 — 2018 · EQF/MEC 5'
  const educationLineCount =
    snapshot.localizedText[language].split(educationLine).length - 1
  if (educationLineCount !== 1)
    throw new Error(
      `localized education (${language}): expected 1 scoped occurrence, found ${educationLineCount}`,
    )
  assertIncludes(
    snapshot.localizedText[language],
    language === 'es' ? 'Evidencia:' : 'Evidence:',
    `${language} evidence label`,
  )
  const href = `/sergio-morales-${language}.pdf`
  const scopedStableCvHrefs = snapshot.localizedHrefs[language].filter(
    (candidate) =>
      /(?:^|\/)sergio-morales-(?:es|en)\.pdf(?:[?#]|$)/.test(
        normalizeHrefForComparison(candidate),
      ),
  )
  if (scopedStableCvHrefs.length !== 1 || scopedStableCvHrefs[0] !== href) {
    throw new Error(
      `${language === 'es' ? 'Spanish' : 'English'} CV link: expected exact scoped CV href set ${JSON.stringify([href])}, got ${JSON.stringify(scopedStableCvHrefs)}`,
    )
  }

  const legacyCvHref = snapshot.hrefs.find((href) => {
    const normalizedHref = normalizeHrefForComparison(href)
    return (
      normalizedHref.includes('sergio-morales-2024-') &&
      normalizedHref.includes('.pdf')
    )
  })
  if (legacyCvHref !== undefined) {
    throw new Error(
      `legacy CV link: found active href ${JSON.stringify(legacyCvHref)}`,
    )
  }

  for (const [href, label] of [
    ['https://www.linkedin.com/in/sergiogmr/', 'LinkedIn link'],
    ['https://github.com/sergiogmr', 'GitHub link'],
  ] as const) {
    if (!snapshot.hrefs.includes(href)) {
      throw new Error(`${label}: expected active href ${JSON.stringify(href)}`)
    }
  }

  const searchableActiveContent = [
    snapshot.activeText,
    ...snapshot.descriptionContents,
    ...snapshot.structuredData.map((value) => JSON.stringify(value)),
  ].join('\n')
  for (const unsupportedClaim of [
    'Remote and async with distributed teams',
    'Trabajo remoto y asincrónico con equipos distribuidos',
  ]) {
    assertExcludes(
      searchableActiveContent,
      unsupportedClaim,
      'unsupported work arrangement',
    )
  }
}

/** The outline starts at h1 and never descends more than one level at a time. */
function assertHeadingOrder(levels: readonly number[], path: string): void {
  if (levels[0] !== undefined && levels[0] !== 1)
    throw new Error(
      `heading order: ${path} starts with h${levels[0]} instead of h1`,
    )
  for (const [index, level] of levels.entries()) {
    const previous = levels[index - 1]
    if (previous !== undefined && level > previous + 1)
      throw new Error(
        `heading order: ${path} skips from h${previous} to h${level}`,
      )
  }
}

export async function verifyPageOutput(
  html: string,
  path: string,
  rootUrl: URL = defaultRootUrl,
): Promise<void> {
  const snapshot = await createHtmlSnapshot(html)
  const language = getLanguage(path)
  const canonical = new URL(path, EXPECTED_SITE_URL).toString()
  if (!hasValidHtmlDocumentStructure(snapshot))
    throw new Error(`document structure: ${path}`)
  if (snapshot.language !== language) throw new Error(`URL locale: ${path}`)
  if (snapshot.h1Count !== 1)
    throw new Error(
      `H1: expected exactly one on ${path}, got ${snapshot.h1Count}`,
    )
  // Applies to every indexable page: home, case studies and the terms pages all
  // keep a gapless outline today.
  assertHeadingOrder(snapshot.headingLevels, path)
  if (snapshot.localizedLanguages.some((value) => value !== language))
    throw new Error(`URL locale: foreign-language content on ${path}`)
  assertSingleValue(
    snapshot.canonicalHrefs,
    canonical,
    `canonical link: ${path}`,
  )
  assertSingleValue(snapshot.robots, 'index, follow', `robots: ${path}`)
  const paths = getAlternatePaths(path)
  for (const lang of ['es', 'en', 'x-default'] as const) {
    assertSingleValue(
      snapshot.alternates[lang] ?? [],
      new URL(
        paths[lang === 'x-default' ? 'es' : lang],
        EXPECTED_SITE_URL,
      ).toString(),
      `language alternates: ${path} ${lang}`,
    )
  }
  for (const lang of ['es', 'en'] as const) {
    const links = snapshot.languageLinks.filter(
      (link) => link.language === lang,
    )
    if (
      links.length !== 1 ||
      links[0]?.href !== paths[lang] ||
      links[0]?.current !== (lang === language ? 'page' : null)
    )
      throw new Error(`language navigation: ${path} ${lang}`)
  }
  const isHome = path === '/' || path === '/en'
  const app = path.includes('/acezone/')
    ? 'acezone'
    : path.includes('/wattly/')
      ? 'wattly'
      : null
  const project = PROFESSIONAL_PROFILE.projects.find((project) =>
    path.endsWith(`/${project.id}`),
  )
  const metadata = isHome
    ? PAGE_METADATA.home[language]
    : app
      ? PAGE_METADATA[app][language]
      : project
        ? createCaseStudyMetadata(project)[language]
        : null
  if (!metadata) throw new Error(`unknown indexable route: ${path}`)
  assertSingleValue(snapshot.titles, metadata.title, `page title: ${path}`)
  assertSingleValue(
    snapshot.descriptionContents,
    metadata.description,
    `meta description: ${path}`,
  )
  // Case studies declare their own emitted WebP card; every other page keeps
  // the generic og.jpg. The declared type and size must describe the real file.
  let card = {
    url: `${EXPECTED_SITE_URL}/og.jpg`,
    type: 'image/jpeg',
    width: '1200',
    height: '630',
  }
  if (project) {
    const declared = snapshot.openGraphContents['og:image']?.[0] ?? ''
    if (!/^https:\/\/sgmr\.dev\/_astro\/[^/]+\.webp$/.test(declared))
      throw new Error(
        `Open Graph og:image: ${path} expected an emitted _astro WebP card, got ${JSON.stringify(declared)}`,
      )
    const emitted = await readRequiredArtifact(
      rootUrl,
      `dist${new URL(declared).pathname}`,
      'social card',
    )
    const size = readWebpSize(emitted, `social card ${path}`)
    const metaSize = [
      snapshot.openGraphContents['og:image:width']?.[0],
      snapshot.openGraphContents['og:image:height']?.[0],
    ]
    if (
      metaSize[0] !== String(size.width) ||
      metaSize[1] !== String(size.height)
    )
      throw new Error(
        `social card dimensions: ${path} meta declares ${metaSize.join('x')} but the file is ${size.width}x${size.height}`,
      )
    if (size.width !== 1200 || size.height !== 630)
      throw new Error(
        `social card dimensions: ${path} must be 1200x630, got ${size.width}x${size.height}`,
      )
    card = {
      url: declared,
      type: 'image/webp',
      width: String(size.width),
      height: String(size.height),
    }
  }
  for (const [property, value] of Object.entries({
    'og:url': canonical,
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:locale': language === 'es' ? 'es_ES' : 'en_US',
    'og:locale:alternate': language === 'es' ? 'en_US' : 'es_ES',
    'og:image': card.url,
    'og:image:type': card.type,
    'og:image:width': card.width,
    'og:image:height': card.height,
    'og:image:alt': metadata.imageAlt,
  })) {
    assertSingleValue(
      snapshot.openGraphContents[property] ?? [],
      value,
      `Open Graph ${property}: ${path}`,
    )
  }
  if (snapshot.twitterPropertyMeta.length)
    throw new Error(
      `Twitter tags: ${path} must use the name attribute, found property ${JSON.stringify(snapshot.twitterPropertyMeta)}`,
    )
  for (const [name, value] of Object.entries({
    'twitter:card': 'summary_large_image',
    'twitter:url': canonical,
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    'twitter:image': card.url,
    'twitter:image:alt': metadata.imageAlt,
    'twitter:site': '@sergiogmr',
    'twitter:creator': '@sergiogmr',
  })) {
    assertSingleValue(
      snapshot.twitterMeta[name] ?? [],
      value,
      `Twitter ${name}: ${path}`,
    )
  }
  if (snapshot.googlebot.length)
    throw new Error(
      `googlebot meta: ${path} must be absent (robots already covers it)`,
    )
  for (const [rel, href, sizes, type] of [
    ['icon', '/favicon.avif', null, 'image/avif'],
    ['icon', '/favicon.ico', '32x32', null],
    ['icon', '/favicon-96x96.png', '96x96', 'image/png'],
    ['apple-touch-icon', '/apple-touch-icon.png', '180x180', null],
  ] as const) {
    const links = snapshot.icons.filter(
      (icon) => icon.rel === rel && icon.href === href,
    )
    if (
      links.length !== 1 ||
      links[0]?.sizes !== sizes ||
      links[0]?.type !== type
    )
      throw new Error(
        `icon link: ${path} expected one <link rel="${rel}" href="${href}" sizes=${sizes} type=${type}>, got ${JSON.stringify(links)}`,
      )
  }
  if (
    snapshot.structuredData.length !== 1 ||
    JSON.stringify(snapshot.structuredData[0]) !==
      JSON.stringify(metadata.schema)
  )
    throw new Error(`page structured data: ${path}`)
  const structured = snapshot.structuredData[0] as StructuredData
  if (structured.dateModified !== PAGE_LAST_MODIFIED[path as IndexablePath])
    throw new Error(
      `dateModified: ${path} expected ${PAGE_LAST_MODIFIED[path as IndexablePath]}, got ${JSON.stringify(structured.dateModified)}`,
    )
  if (
    !findPeople(structured).some(
      (person) =>
        person['@id'] === PERSON_ID &&
        person.name === PROFESSIONAL_PROFILE.person.name &&
        person.alternateName === 'SergioGMR' &&
        person.image === `${EXPECTED_SITE_URL}/sergio-morales-avatar.png`,
    )
  )
    throw new Error(`Person structured data: ${path} expected the full Person`)
  if (isHome) {
    await verifyHtmlOutput(html, language)
    for (const project of PROFESSIONAL_PROFILE.projects) {
      const href = getAlternatePaths(`/proyectos/${project.id}`)[language]
      if (!snapshot.hrefs.includes(href))
        throw new Error(`project discovery link: ${path} ${project.id}`)
    }
    assertIncludes(
      snapshot.activeText,
      PROFESSIONAL_PROFILE.person.name,
      'visible identity',
    )
    assertIncludes(
      snapshot.activeText,
      PROFESSIONAL_PROFILE.person.location[language],
      'visible location',
    )
  }
  if (project) {
    const text = snapshot.activeText.replace(/\s+/g, ' ')
    for (const field of [
      'problem',
      'responsibility',
      'solution',
      'result',
    ] as const)
      assertIncludes(
        text,
        project[field][language],
        `case-study ${field}: ${path}`,
      )
    for (const task of project.tasks[language])
      assertIncludes(text, task, `case-study task: ${path}`)
    for (const technology of project.technologies)
      assertIncludes(text, technology, `case-study technology: ${path}`)
    if (!snapshot.hrefs.includes(project.evidenceUrl))
      throw new Error(`project website link: ${path}`)
  }
  if (!snapshot.hrefs.includes(PROFESSIONAL_PROFILE.links.mail))
    throw new Error(`contact link: ${path}`)
  if (!JSON.stringify(metadata.schema).includes(PERSON_ID))
    throw new Error(`stable person identity: ${path}`)
  await verifyHeadPreamble(html, path)
  await verifyContentSecurityPolicy(html, path)
}

// The HTML spec needs the encoding declaration within the first 1024 bytes of
// the document, and the preload and theme script ahead of it would push it out.
const HEAD_PREAMBLE_LIMIT = 1024
const HTML_NON_WHITESPACE = /[^ \t\n\f\r]/
// What survives of everything before <head> once `sanitizingRewriter` has run:
// HTML whitespace and, optionally, the bare <html> tag.
const SANITIZED_PRELUDE = /^[ \t\n\f\r]*(?:<html\s*\/?>[ \t\n\f\r]*)?$/i
const END_TAG = /<\/([a-z][^\s/>]*)/gi

// Marks where lol-html sees the first <head> (and the end of the charset meta),
// so what precedes it can be measured. Random, so the markup cannot forge it.
const headMarker = `<!--head-verifier-${randomUUID()}-->`
const charsetMarker = `<!--charset-verifier-${randomUUID()}-->`

// lol-html tokenizes like a browser, which a regex over the markup does not:
// abrupt comments (`<!-->`), `--!>`, `</style x>`, `</style/>`, and `<`, `>` or
// `<!--` inside attribute values all trip one up. This rewriter drops the
// parts that hide or fake markup (comments, the doctype, every attribute and
// the body of raw text elements and templates), so that whatever tags remain
// in the output are exactly the ones a browser would see.
function sanitizingRewriter(onText?: (text: string) => void): HTMLRewriter {
  return new HTMLRewriter()
    .onDocument({
      doctype(doctype) {
        doctype.remove()
      },
      comments(comment) {
        comment.remove()
      },
      text(chunk) {
        onText?.(chunk.text)
      },
    })
    .on('*', {
      element(element) {
        for (const [name] of [...element.attributes])
          element.removeAttribute(name)
      },
    })
    .on('script, style, title, template', {
      element(element) {
        element.setInnerContent('')
      },
    })
}

export async function verifyHeadPreamble(
  html: string,
  label: string,
): Promise<void> {
  const fail = (reason: string): never => {
    throw new Error(`head preamble (${label}): ${reason}`)
  }
  // Pass 1: only whitespace, comments, the doctype and a bare <html> may come
  // before <head>. Anything else (text, an element, a stray end tag, U+FEFF)
  // makes a browser start the body early, so the later head, and the CSP meta
  // in it, ends up ignored.
  let headFound = false
  let textBeforeHead = false
  const sanitized = await sanitizingRewriter((text) => {
    if (!headFound && HTML_NON_WHITESPACE.test(text)) textBeforeHead = true
  })
    .on('head', {
      element(element) {
        if (headFound) return
        headFound = true
        element.before(headMarker, { html: true })
      },
    })
    .transform(new Response(html))
    .text()
  if (!headFound) return fail('missing <head>')
  if (
    textBeforeHead ||
    !SANITIZED_PRELUDE.test(sanitized.slice(0, sanitized.indexOf(headMarker)))
  )
    return fail(
      'only whitespace and comments may sit between the doctype, <html> and <head>',
    )

  // Pass 2, on the untouched markup: the first element in head, the byte
  // offset of its end, and the charset and viewport metas in head.
  let seenHead = false
  let inHead = false
  let textBeforeFirst = false
  let first: { tag: string; attributes: [string, string][] } | undefined
  let charsets = 0
  let viewports = 0
  const measured = await new HTMLRewriter()
    .onDocument({
      text(chunk) {
        if (seenHead && !first && HTML_NON_WHITESPACE.test(chunk.text))
          textBeforeFirst = true
      },
    })
    .on('*', {
      element(element) {
        const tag = element.tagName.toLowerCase()
        if (tag === 'head' && !seenHead) {
          seenHead = true
          inHead = true
          element.onEndTag(() => {
            inHead = false
          })
          return
        }
        if (!seenHead || first) return
        first = { tag, attributes: [...element.attributes] }
        if (tag === 'meta') element.after(charsetMarker, { html: true })
      },
    })
    .on('meta', {
      element(element) {
        if (!inHead) return
        if (element.hasAttribute('charset')) charsets += 1
        if (element.getAttribute('name')?.toLowerCase() === 'viewport')
          viewports += 1
      },
    })
    .transform(new Response(html))
    .text()
  const [charsetAttribute] = first?.attributes ?? []
  if (
    textBeforeFirst ||
    first?.tag !== 'meta' ||
    first.attributes.length !== 1 ||
    charsetAttribute?.[0].toLowerCase() !== 'charset' ||
    charsetAttribute[1].toLowerCase() !== 'utf-8'
  )
    return fail('the first element in head must be <meta charset="utf-8">')
  const end = Buffer.byteLength(
    measured.slice(0, measured.indexOf(charsetMarker)),
  )
  if (end > HEAD_PREAMBLE_LIMIT)
    fail(
      `the charset meta must end within the first ${HEAD_PREAMBLE_LIMIT} bytes, it ends at byte ${end}`,
    )
  if (charsets !== 1) fail(`expected exactly one charset meta, got ${charsets}`)
  if (viewports !== 1)
    fail(`expected exactly one viewport meta, got ${viewports}`)
}

const CSP_REQUIRED_DIRECTIVES = [
  ['default-src', "'self'"],
  ['img-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'self'"],
  ['form-action', "'self'"],
] as const
const CSP_HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'] as const
const CSP_HASH_SOURCE = /^'sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}'$/
// The only sources any directive may list: the config uses nothing else.
const CSP_SELF_OR_NONE = new Set(["'self'", "'none'"])
// Not used by the config, so they are rejected outright instead of being held
// to the same allowlist: a stray `*-elem`/`*-attr` overrides `script-src` and
// `style-src` for elements or attributes.
const CSP_FORBIDDEN_DIRECTIVES = new Set([
  'script-src-elem',
  'script-src-attr',
  'style-src-elem',
  'style-src-attr',
])
// What may precede the CSP meta in head. Any other start tag or text makes a
// browser close head implicitly and move the meta into body, which ignores it.
const HEAD_PRE_POLICY_ELEMENTS = new Set([
  'meta',
  'link',
  'title',
  'script',
  'style',
  'noscript',
  'template',
])
// End tags a browser handles in head; any other one closes it early or is
// reprocessed in body (`</body>`, `</html>`, `</br>`), so the CSP meta after it
// would be ignored.
const HEAD_PRE_POLICY_END_TAGS = new Set([
  'title',
  'script',
  'style',
  'noscript',
  'template',
])
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])
// Script types a browser executes: `module` and the HTML JavaScript MIME types.
const EXECUTABLE_SCRIPT_TYPE =
  /^(?:module|(?:text|application)\/(?:x-)?(?:java|ecma|j|live)script(?:1\.\d)?)$/
// Data blocks that `script-src` still governs, so inline ones need a hash.
const HASHED_DATA_SCRIPT_TYPES = new Set(['importmap', 'speculationrules'])

type ScriptKind = 'executable' | 'hashed-data' | 'data'

function classifyScriptType(type: string | null): ScriptKind {
  // Trimming covers the HTML whitespace set; parameters are ignored so that
  // `text/javascript; charset=utf-8` is never treated as inert data.
  const essence = (type ?? '').split(';')[0]!.trim().toLowerCase()
  if (essence === '' || EXECUTABLE_SCRIPT_TYPE.test(essence))
    return 'executable'
  return HASHED_DATA_SCRIPT_TYPES.has(essence) ? 'hashed-data' : 'data'
}

function cspHashes(content: string): string[] {
  return CSP_HASH_ALGORITHMS.map(
    (algorithm) =>
      `'${algorithm}-${createHash(algorithm).update(content, 'utf8').digest('base64')}'`,
  )
}

// Resolve like a browser: it strips tabs and newlines and reads `\` as `/`, so
// `/\evil.com/x.js` is cross-origin even though it starts with a slash.
function isSameOriginUrl(src: string): boolean {
  try {
    return new URL(src, EXPECTED_SITE_URL).origin === EXPECTED_SITE_URL
  } catch {
    return false
  }
}

// Marks where lol-html sees the CSP meta, so what precedes it can be scanned.
const policyMarker = `<!--csp-verifier-${randomUUID()}-->`

// What is left of the head before the CSP meta, minus anything a browser reads
// as comment or raw text, may hold only end tags that head itself handles.
async function findStrayEndTag(
  beforePolicy: string,
): Promise<string | undefined> {
  const sanitized = await sanitizingRewriter()
    .transform(new Response(beforePolicy))
    .text()
  for (const match of sanitized.matchAll(END_TAG)) {
    const tag = match[1]!.toLowerCase()
    if (!HEAD_PRE_POLICY_END_TAGS.has(tag)) return tag
  }
  return undefined
}

// Astro emits the policy as a meta tag, so the browser enforces it only for
// content that follows it. `is:inline` scripts are not hashed by Astro: this
// check is what keeps the hashes in `astro.config.ts` aligned with the output.
export async function verifyContentSecurityPolicy(
  html: string,
  label: string,
): Promise<void> {
  const fail = (reason: string): never => {
    throw new Error(`CSP (${label}): ${reason}`)
  }
  const policies: { content: string; inHead: boolean }[] = []
  const executableBeforePolicy: { inline: boolean }[] = []
  const executableScripts: { inline: boolean }[] = []
  const inlineScripts: string[] = []
  const inlineStyles: string[] = []
  const eventHandlers: string[] = []
  const styleAttributes: string[] = []
  const externalScripts: string[] = []
  let inertDepth = 0
  let headDepth = 0
  // Open elements inside head, so text is judged only when it is head's own.
  let headChildDepth = 0
  // First thing before the CSP meta that makes a browser close head early.
  let headViolation: string | undefined
  let activeText: string[] | undefined

  // An element keeps only one end-tag callback, so the `*` handler (registered
  // first) owns it and the specific handlers below add theirs through `onEnd`.
  let endCallbacks: (() => void)[] = []
  const onEnd = (callback: () => void) => {
    endCallbacks.push(callback)
  }

  const rewriter = new HTMLRewriter()
    .on('*', {
      element(element) {
        const tag = element.tagName.toLowerCase()
        const callbacks: (() => void)[] = []
        endCallbacks = callbacks
        if (!VOID_ELEMENTS.has(tag) && !element.selfClosing)
          element.onEndTag(() => {
            for (const callback of callbacks) callback()
          })
        // A <head> opening head is the document's own; one nested in it is not.
        const nestedInHead = headDepth > 0
        if (nestedInHead && inertDepth === 0 && policies.length === 0) {
          if (!HEAD_PRE_POLICY_ELEMENTS.has(tag))
            headViolation ??= `<${tag}> is not allowed in head before the CSP meta`
          // `<title/>` is an empty element to lol-html but opens RCDATA in a
          // browser, which then swallows the CSP meta as text.
          else if (element.selfClosing && !VOID_ELEMENTS.has(tag))
            headViolation ??= `<${tag}/> uses self-closing syntax on a non-void element before the CSP meta`
          // Loaded before the policy applies, so it must stay on this origin.
          else if (tag === 'link') {
            const href = element.getAttribute('href')
            // lol-html reads the value raw, a browser decodes `&#58;` and the like.
            if (href?.includes('&'))
              headViolation ??= `<link href> before the CSP meta must not contain '&' (character references): ${href}`
            else if (href !== null && !isSameOriginUrl(href))
              headViolation ??= `cross-origin <link> before the CSP meta: ${href}`
          }
        }
        if (nestedInHead && !VOID_ELEMENTS.has(tag)) {
          headChildDepth += 1
          onEnd(() => {
            headChildDepth -= 1
          })
        }
        for (const [name] of element.attributes) {
          if (/^on/i.test(name))
            eventHandlers.push(`<${element.tagName} ${name}>`)
          else if (name.toLowerCase() === 'style')
            styleAttributes.push(`<${element.tagName}>`)
        }
      },
    })
    .on('template, noscript', {
      element() {
        inertDepth += 1
        onEnd(() => {
          inertDepth -= 1
        })
      },
    })
    .on('head', {
      element() {
        headDepth += 1
        onEnd(() => {
          headDepth -= 1
        })
      },
    })
    .on('img, source, image', {
      element(element) {
        for (const name of ['src', 'srcset', 'href'])
          if (/(?:^|[\s,])data:/i.test(element.getAttribute(name) ?? ''))
            fail(
              `data: URI in <${element.tagName} ${name}> (img-src is 'self')`,
            )
      },
    })
    .on('head', {
      text(chunk) {
        if (
          headDepth === 1 &&
          headChildDepth === 0 &&
          policies.length === 0 &&
          HTML_NON_WHITESPACE.test(chunk.text)
        )
          headViolation ??= 'text in head before the CSP meta'
      },
    })
    .on('meta', {
      element(element) {
        if (
          element.getAttribute('http-equiv')?.toLowerCase() !==
          'content-security-policy'
        )
          return
        // A meta inside <template> or <noscript> is inert: no policy applies.
        if (inertDepth > 0) return
        policies.push({
          content: element.getAttribute('content') ?? '',
          inHead: headDepth > 0,
        })
        if (policies.length === 1) {
          executableBeforePolicy.push(...executableScripts)
          element.before(policyMarker, { html: true })
        }
      },
    })
    .on('script', {
      element(element) {
        const src = element.getAttribute('src')
        if (src !== null && !isSameOriginUrl(src)) externalScripts.push(src)
        if (inertDepth > 0) return
        const kind = classifyScriptType(element.getAttribute('type'))
        if (kind === 'data') return
        if (kind === 'executable')
          executableScripts.push({ inline: src === null })
        if (src !== null) return
        const chunks: string[] = []
        activeText = chunks
        onEnd(() => {
          inlineScripts.push(chunks.join(''))
          activeText = undefined
        })
      },
      text(chunk) {
        activeText?.push(chunk.text)
      },
    })
    .on('style', {
      element() {
        if (inertDepth > 0) return
        const chunks: string[] = []
        activeText = chunks
        onEnd(() => {
          inlineStyles.push(chunks.join(''))
          activeText = undefined
        })
      },
      text(chunk) {
        activeText?.push(chunk.text)
      },
    })
  const rewritten = await rewriter.transform(new Response(html)).text()

  if (policies.length !== 1)
    fail(
      `expected exactly one content-security-policy meta, got ${policies.length}`,
    )
  const policy = policies[0]!
  if (!policy.inHead) fail('CSP meta must be in head')
  if (headViolation) fail(headViolation)
  const strayEndTag = await findStrayEndTag(
    rewritten.slice(0, rewritten.indexOf(policyMarker)),
  )
  if (strayEndTag)
    fail(`</${strayEndTag}> end tag before the CSP meta is not allowed in head`)
  // lol-html reads attribute values raw, a browser decodes character references.
  if (policy.content.includes('&'))
    fail("the CSP content must not contain '&' (character references)")
  const beforePolicy = executableBeforePolicy
  if (
    beforePolicy.length > 1 ||
    (beforePolicy.length === 1 && !beforePolicy[0]!.inline)
  )
    fail(
      'executable scripts other than the first inline theme script run before the CSP meta',
    )

  const directives = new Map<string, string[]>()
  for (const part of policy.content.split(';')) {
    const [rawName, ...sources] = part.trim().split(/\s+/)
    if (!rawName) continue
    const name = rawName.toLowerCase()
    // Browsers read only the first copy of a directive; a repeat is a mistake.
    if (directives.has(name)) fail(`duplicate directive ${name}`)
    directives.set(name, sources)
  }
  if (directives.has('frame-ancestors'))
    fail('frame-ancestors is ignored in a meta tag; use a response header')
  for (const [name, source] of CSP_REQUIRED_DIRECTIVES) {
    if (directives.get(name)?.join(' ') !== source)
      fail(`${name} must be exactly ${source}`)
  }
  for (const [name, sources] of directives) {
    if (CSP_FORBIDDEN_DIRECTIVES.has(name))
      fail(
        `${name} is not allowed; it overrides ${name.replace(/-(?:elem|attr)$/, '')} and the config does not use it`,
      )
    for (const source of sources)
      if (!CSP_SELF_OR_NONE.has(source) && !CSP_HASH_SOURCE.test(source))
        fail(
          `${name} may only list 'self', 'none' and hashes, got ${source} (no unsafe-inline, unsafe-eval, unsafe-hashes, wasm-unsafe-eval, wildcards, schemes or hosts)`,
        )
  }

  const allowed = new Map<string, Set<string>>()
  for (const name of ['script-src', 'style-src'] as const) {
    const sources = directives.get(name)
    if (!sources) return fail(`${name} is missing`)
    if (!sources.includes("'self'")) fail(`${name} must allow 'self'`)
    allowed.set(name, new Set(sources))
  }
  for (const body of inlineScripts)
    if (!cspHashes(body).some((hash) => allowed.get('script-src')!.has(hash)))
      fail(
        `inline script hash missing from script-src: ${body.trim().slice(0, 60)}`,
      )
  for (const body of inlineStyles)
    if (!cspHashes(body).some((hash) => allowed.get('style-src')!.has(hash)))
      fail(
        `inline style hash missing from style-src: ${body.trim().slice(0, 60)}`,
      )
  if (eventHandlers.length)
    fail(
      `inline event handler attribute is blocked: ${eventHandlers.join(', ')}`,
    )
  if (styleAttributes.length)
    fail(`inline style attribute is blocked: ${styleAttributes.join(', ')}`)
  if (externalScripts.length)
    fail(`external script source: ${externalScripts.join(', ')}`)
}

export async function verifyNotFoundOutput(html: string): Promise<void> {
  const snapshot = await createHtmlSnapshot(html)
  if (!hasValidHtmlDocumentStructure(snapshot) || snapshot.h1Count !== 1)
    throw new Error('404 document structure')
  assertSingleValue(snapshot.robots, 'noindex, follow', '404 robots')
  if (
    snapshot.canonicalHrefs.length ||
    Object.keys(snapshot.alternates).length ||
    snapshot.structuredData.length
  )
    throw new Error(
      '404 discovery metadata: canonical, alternates and schema must be absent',
    )
  await verifyHeadPreamble(html, '404')
  await verifyContentSecurityPolicy(html, '404')
}

function sitemapError(reason: string, locations: string[] = []): never {
  throw new Error(
    `sitemap locations mismatch; expected ${JSON.stringify(expectedSitemapLocations)}, got ${JSON.stringify(locations)}; ${reason}`,
  )
}

function isValidXmlCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  )
}

function assertValidXmlCharacters(
  value: string,
  locations: string[] = [],
): void {
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    if (!isValidXmlCodePoint(codePoint)) {
      sitemapError(
        `invalid XML character U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
        locations,
      )
    }
  }
}

function assertValidXmlText(text: string, locations: string[]): void {
  if (text.includes(']]>')) {
    sitemapError('forbidden ]]> sequence in XML text', locations)
  }

  let cursor = 0
  while (cursor < text.length) {
    const ampersand = text.indexOf('&', cursor)
    if (ampersand === -1) {
      return
    }

    const entity = text
      .slice(ampersand)
      .match(/^&(amp|lt|gt|apos|quot|#([0-9]+)|#x([0-9a-fA-F]+));/)
    if (entity === null) {
      sitemapError('unknown or unterminated XML entity', locations)
    }

    const numericValue = entity[2] ?? entity[3]
    if (numericValue !== undefined) {
      const radix = entity[2] === undefined ? 16 : 10
      const codePoint = Number.parseInt(numericValue, radix)
      if (!isValidXmlCodePoint(codePoint)) {
        sitemapError(
          'numeric entity references an invalid XML character',
          locations,
        )
      }
    }

    cursor = ampersand + entity[0].length
  }
}

function parseSitemapXml(sitemapXml: string): SitemapSnapshot {
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>'
  assertValidXmlCharacters(sitemapXml)
  if (!sitemapXml.startsWith(declaration)) {
    sitemapError('XML declaration must be the first exact content')
  }

  const elements: SitemapElement[] = []
  const locations: string[] = []
  const lastModified: string[] = []
  const urlLocationCounts: number[] = []
  const urlLastModifiedCounts: number[] = []
  let cursor = declaration.length
  let rootCount = 0

  const closeElement = (name: string): void => {
    const element = elements.pop()
    if (element?.name !== name) {
      sitemapError(
        `expected closing tag for ${JSON.stringify(element?.name)}, got ${JSON.stringify(name)}`,
        locations,
      )
    }

    if (name === 'loc') {
      locations.push(element.text.trim())
    }
    if (name === 'lastmod') {
      lastModified.push(element.text.trim())
    }
    if (name === 'url') {
      urlLocationCounts.push(element.directLocationCount)
      urlLastModifiedCounts.push(element.directLastModifiedCount)
    }
  }

  while (cursor < sitemapXml.length) {
    if (sitemapXml.startsWith('<!--', cursor)) {
      const commentEnd = sitemapXml.indexOf('-->', cursor + 4)
      if (commentEnd === -1) {
        sitemapError('unclosed XML comment', locations)
      }
      const comment = sitemapXml.slice(cursor + 4, commentEnd)
      if (comment.includes('--') || comment.endsWith('-')) {
        sitemapError('invalid XML comment content', locations)
      }
      cursor = commentEnd + 3
      continue
    }

    if (sitemapXml.startsWith('<?', cursor)) {
      sitemapError('unexpected XML processing instruction', locations)
    }

    if (sitemapXml[cursor] !== '<') {
      const nextTag = sitemapXml.indexOf('<', cursor)
      const textEnd = nextTag === -1 ? sitemapXml.length : nextTag
      const text = sitemapXml.slice(cursor, textEnd)
      const currentElement = elements.at(-1)
      assertValidXmlText(text, locations)

      if (currentElement === undefined) {
        if (text.trim() !== '') {
          sitemapError('text outside the root element', locations)
        }
      } else {
        if (
          (currentElement.name === 'urlset' || currentElement.name === 'url') &&
          text.trim() !== ''
        ) {
          sitemapError(
            `unexpected text inside ${JSON.stringify(currentElement.name)}`,
            locations,
          )
        }
        currentElement.text += text
      }

      cursor = textEnd
      continue
    }

    const tagEnd = sitemapXml.indexOf('>', cursor + 1)
    if (tagEnd === -1) {
      sitemapError('unclosed XML tag', locations)
    }

    const tag = sitemapXml.slice(cursor, tagEnd + 1)
    const closingMatch = tag.match(/^<\/([a-z][a-z0-9]*)\s*>$/)
    if (closingMatch !== null) {
      closeElement(closingMatch[1]!)
      cursor = tagEnd + 1
      continue
    }

    if (tag.startsWith('</') || tag.startsWith('<!')) {
      sitemapError(`invalid XML tag ${JSON.stringify(tag)}`, locations)
    }

    const selfClosing = tag.endsWith('/>')
    const tagBody = tag.slice(1, selfClosing ? -2 : -1).trim()
    const firstWhitespace = tagBody.search(/\s/)
    const name =
      firstWhitespace === -1 ? tagBody : tagBody.slice(0, firstWhitespace)
    const attributes =
      firstWhitespace === -1 ? '' : tagBody.slice(firstWhitespace).trim()

    if (!/^[a-z][a-z0-9]*$/.test(name)) {
      sitemapError(
        `invalid case or element name ${JSON.stringify(name)}`,
        locations,
      )
    }

    const parent = elements.at(-1)
    if (name === 'urlset') {
      if (
        parent !== undefined ||
        rootCount !== 0 ||
        attributes !== 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
      ) {
        sitemapError('invalid urlset root', locations)
      }
      rootCount += 1
    } else if (name === 'url') {
      if (parent?.name !== 'urlset' || attributes !== '') {
        sitemapError('url must be a direct child of urlset', locations)
      }
    } else if (name === 'loc' || name === 'lastmod') {
      if (parent?.name !== 'url' || attributes !== '') {
        sitemapError(
          `${name} must be an attribute-free direct child of url`,
          locations,
        )
      }
    } else {
      sitemapError(
        `unexpected sitemap element ${JSON.stringify(name)}`,
        locations,
      )
    }

    const element: SitemapElement = {
      name,
      text: '',
      directLocationCount: 0,
      directLastModifiedCount: 0,
    }
    if (name === 'loc' && parent !== undefined) {
      parent.directLocationCount += 1
    }
    if (name === 'lastmod' && parent !== undefined) {
      parent.directLastModifiedCount += 1
    }
    elements.push(element)

    if (selfClosing) {
      closeElement(name)
    }
    cursor = tagEnd + 1
  }

  if (elements.length !== 0) {
    sitemapError(
      `unclosed XML element ${JSON.stringify(elements.at(-1)?.name)}`,
      locations,
    )
  }
  if (rootCount !== 1) {
    sitemapError(`expected one urlset root, found ${rootCount}`, locations)
  }

  return { locations, lastModified, urlLocationCounts, urlLastModifiedCounts }
}

export async function verifySitemapOutput(sitemapXml: string): Promise<void> {
  const snapshot = parseSitemapXml(sitemapXml)
  const hasExpectedStructure = snapshot.urlLocationCounts.every(
    (locationCount) => locationCount === 1,
  )
  const hasExpectedLocations =
    JSON.stringify(snapshot.locations) ===
    JSON.stringify(expectedSitemapLocations)

  if (!hasExpectedStructure || !hasExpectedLocations) {
    sitemapError(
      'unexpected sitemap structure or locations',
      snapshot.locations,
    )
  }
  if (!snapshot.urlLastModifiedCounts.every((count) => count === 1)) {
    sitemapError(
      'every url must have exactly one direct lastmod',
      snapshot.locations,
    )
  }
  if (
    !snapshot.lastModified.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
  ) {
    sitemapError('lastmod must use the YYYY-MM-DD format', snapshot.locations)
  }
  if (
    JSON.stringify(snapshot.lastModified) !==
    JSON.stringify(expectedSitemapLastModified)
  ) {
    sitemapError(
      `lastmod values ${JSON.stringify(snapshot.lastModified)} differ from the page dates ${JSON.stringify(expectedSitemapLastModified)}`,
      snapshot.locations,
    )
  }
}

export async function verifyPortfolioOutput(
  rootUrl = defaultRootUrl,
): Promise<void> {
  const [indexHtml, sitemapXml] = await Promise.all([
    readFile(new URL('dist/index.html', rootUrl), 'utf8'),
    readFile(new URL('dist/sitemap.xml', rootUrl), 'utf8'),
  ])

  await Promise.all([
    verifyHtmlOutput(indexHtml),
    verifySitemapOutput(sitemapXml),
  ])
  await verifySitemapRouteArtifacts(rootUrl)
  await verifyIdentityAssets(rootUrl)
  const missingHtml = await readRequiredArtifact(
    rootUrl,
    'dist/404.html',
    '404 page',
  )
  await verifyNotFoundOutput(missingHtml.toString('utf8'))
  const missingVercel = await readRequiredArtifact(
    rootUrl,
    '.vercel/output/static/404.html',
    'Vercel 404 artifact',
  )
  if (!missingHtml.equals(missingVercel))
    throw new Error('Vercel 404 artifact differs from dist')
  const social = await readRequiredArtifact(
    rootUrl,
    'dist/og.jpg',
    'social JPEG',
  )
  if (
    social[0] !== 0xff ||
    social[1] !== 0xd8 ||
    social.at(-2) !== 0xff ||
    social.at(-1) !== 0xd9
  )
    throw new Error('social JPEG: invalid format')
  const outputConfig = JSON.parse(
    await readFile(new URL('.vercel/output/config.json', rootUrl), 'utf8'),
  ) as {
    routes: {
      src?: string
      dest?: string
      status?: number
      headers?: { Location?: string }
      handle?: string
    }[]
  }
  const slash = outputConfig.routes.find((route) => route.src === '^/(.*)/$')
  if (slash?.status !== 308 || slash.headers?.Location !== '/$1')
    throw new Error('Vercel slash normalization: expected emitted 308')
  const notFound = outputConfig.routes.at(-1)
  if (
    notFound?.src !== '^/.*$' ||
    notFound.dest !== '/404.html' ||
    notFound.status !== 404 ||
    !outputConfig.routes.some((route) => route.handle === 'filesystem')
  )
    throw new Error(
      'Vercel 404 route: expected real emitted status 404 fallback after filesystem',
    )

  for (const locale of ['es', 'en'] as const) {
    const stableLabel = `${locale.toUpperCase()} stable CV`
    const aliasLabel = `${locale.toUpperCase()} 2024 CV alias`
    const stable = await readRequiredArtifact(
      rootUrl,
      `dist/sergio-morales-${locale}.pdf`,
      stableLabel,
    )
    assertCanonicalPdf(stableLabel, stable, canonicalPdfSha256[locale])

    // The year-stamped alias is a permanent redirect, never a second PDF copy.
    for (const directory of ['dist', '.vercel/output/static']) {
      const aliasPath = `${directory}/sergio-morales-2024-${locale}.pdf`
      if (await pathExists(new URL(aliasPath, rootUrl))) {
        throw new Error(
          `${aliasLabel}: ${aliasPath} must not be emitted; it must redirect instead`,
        )
      }
    }
    const aliasRedirect = outputConfig.routes.find(
      (route) => route.src === `^/sergio-morales-2024-${locale}\\.pdf$`,
    )
    if (
      (aliasRedirect?.status !== 301 && aliasRedirect?.status !== 308) ||
      aliasRedirect.headers?.Location !== `/sergio-morales-${locale}.pdf`
    ) {
      throw new Error(
        `${aliasLabel} redirect: expected an emitted permanent redirect (301 or 308) to /sergio-morales-${locale}.pdf`,
      )
    }
  }

  console.log(
    'Portfolio output verification passed: HTML metadata, localization, links, sitemap, canonical PDFs, social cards, icons, and permanent CV alias redirects.',
  )
}

if (import.meta.main) {
  verifyPortfolioOutput().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
