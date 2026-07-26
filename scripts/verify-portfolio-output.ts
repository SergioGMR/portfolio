import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const defaultRootUrl = new URL('../', import.meta.url)

const canonicalPdfSha256 = {
  es: '1cde05758d5e3109f7151ec4f96b91c2bc3592df473914cd91177388e5071add',
  en: 'a1ceeec46ad62401a2164ef3566d4fcabbe8a141577134dd7a752e1395bee7a9',
} as const

const expectedSitemapLocations = [
  'https://sgmr.dev/',
  'https://sgmr.dev/acezone/tos',
  'https://sgmr.dev/wattly/tos',
]

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
}

interface SitemapElement {
  name: string
  text: string
  directLocationCount: number
}

interface SitemapSnapshot {
  locations: string[]
  urlLocationCounts: number[]
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

async function verifySitemapRouteArtifacts(rootUrl: URL): Promise<void> {
  for (const location of expectedSitemapLocations) {
    const pathname = new URL(location).pathname
    const artifactPath =
      pathname === '/' ? 'dist/index.html' : `dist${pathname}/index.html`
    const artifact = await readRequiredArtifact(
      rootUrl,
      artifactPath,
      'sitemap route artifact',
    )
    const snapshot = await createHtmlSnapshot(artifact.toString('utf8'))

    if (!hasValidHtmlDocumentStructure(snapshot)) {
      throw new Error(
        `sitemap route artifact: expected emitted HTML at ${artifactPath}`,
      )
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
      element() {
        if (inertDepth === 0) {
          htmlCount += 1
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

export async function verifyHtmlOutput(indexHtml: string): Promise<void> {
  const snapshot = await createHtmlSnapshot(indexHtml)
  const expectedTitle = 'Sergio Morales Rodríguez — Tech Lead Full Stack'
  const expectedDescription =
    'Portfolio de Sergio Morales Rodríguez, Tech Lead Full Stack especializado en liderazgo técnico, arquitectura, APIs y entrega de producto.'
  const expectedCanonicalUrl = 'https://sgmr.dev/'

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
    ['og:image', 'https://sgmr.dev/og.avif', 'Open Graph image'],
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

  for (const [language, label] of [
    ['es', 'Spanish localization'],
    ['en', 'English localization'],
  ] as const) {
    if (!snapshot.localizedLanguages.includes(language)) {
      throw new Error(
        `${label}: expected active data-lang-content=${JSON.stringify(language)}`,
      )
    }
  }

  const educationLine = 'I.E.S. El Ricón · 2016 — 2018 · EQF/MEC 5'
  for (const language of ['es', 'en'] as const) {
    const educationLineCount =
      snapshot.localizedText[language].split(educationLine).length - 1
    if (educationLineCount !== 1) {
      throw new Error(
        `localized education (${language}): expected 1 scoped occurrence, found ${educationLineCount}`,
      )
    }
  }

  assertIncludes(
    snapshot.localizedText.es,
    'Evidencia:',
    'Spanish evidence label',
  )
  assertIncludes(
    snapshot.localizedText.en,
    'Evidence:',
    'English evidence label',
  )

  for (const [language, href, label] of [
    ['es', '/sergio-morales-es.pdf', 'Spanish CV link'],
    ['en', '/sergio-morales-en.pdf', 'English CV link'],
  ] as const) {
    const scopedStableCvHrefs = snapshot.localizedHrefs[language].filter(
      (candidate) =>
        /(?:^|\/)sergio-morales-(?:es|en)\.pdf(?:[?#]|$)/.test(
          normalizeHrefForComparison(candidate),
        ),
    )
    if (scopedStableCvHrefs.length !== 1 || scopedStableCvHrefs[0] !== href) {
      throw new Error(
        `${label}: expected exact scoped CV href set ${JSON.stringify([href])}, got ${JSON.stringify(scopedStableCvHrefs)}`,
      )
    }
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
  const urlLocationCounts: number[] = []
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
    if (name === 'url') {
      urlLocationCounts.push(element.directLocationCount)
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
    } else if (
      name === 'loc' ||
      name === 'lastmod' ||
      name === 'changefreq' ||
      name === 'priority'
    ) {
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
    }
    if (name === 'loc' && parent !== undefined) {
      parent.directLocationCount += 1
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

  return { locations, urlLocationCounts }
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

  for (const locale of ['es', 'en'] as const) {
    const stableLabel = `${locale.toUpperCase()} stable CV`
    const aliasLabel = `${locale.toUpperCase()} 2024 CV alias`
    const stable = await readRequiredArtifact(
      rootUrl,
      `dist/sergio-morales-${locale}.pdf`,
      stableLabel,
    )
    const legacyAlias = await readRequiredArtifact(
      rootUrl,
      `dist/sergio-morales-2024-${locale}.pdf`,
      aliasLabel,
    )
    const expectedSha256 = canonicalPdfSha256[locale]

    assertCanonicalPdf(stableLabel, stable, expectedSha256)
    assertCanonicalPdf(aliasLabel, legacyAlias, expectedSha256)

    if (!stable.equals(legacyAlias)) {
      throw new Error(
        `${locale.toUpperCase()} CV alias differs from stable PDF`,
      )
    }
  }

  console.log(
    'Portfolio output verification passed: HTML metadata, localization, links, sitemap, and canonical PDF aliases.',
  )
}

if (import.meta.main) {
  verifyPortfolioOutput().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
