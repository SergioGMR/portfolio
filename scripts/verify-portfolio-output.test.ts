import { afterEach, describe, expect, test } from 'bun:test'
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  INDEXABLE_PATHS,
  SITE_URL,
  getAlternatePaths,
  getLanguage,
} from '../src/lib/site'
import {
  PAGE_METADATA,
  createCaseStudyMetadata,
} from '../src/lib/page-metadata'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

const projectRoot = new URL('../', import.meta.url)
const fixtureRoots: string[] = []

const educationLine = 'I.E.S. El Ricón · 2016 — 2018 · EQF/MEC 5'
const expectedTitle =
  '<title>Sergio Morales Rodríguez — Tech Lead Full Stack</title>'
const spanishCvHref = 'href="/sergio-morales-es.pdf"'
const englishCvHref = 'href="/sergio-morales-en.pdf"'
const personStructuredData = `<script type="application/ld+json">${JSON.stringify(PAGE_METADATA.home.es.schema)}</script>`
const expectedDescription =
  'Portfolio de Sergio Morales Rodríguez, Tech Lead Full Stack especializado en liderazgo técnico, arquitectura, APIs y entrega de producto.'
const descriptionMeta = `<meta name="description" content="${expectedDescription}">`
const canonicalLink = '<link rel="canonical" href="https://sgmr.dev/">'
const openGraphUrl = '<meta property="og:url" content="https://sgmr.dev/">'
const openGraphMetadata = [
  '<meta property="og:type" content="website">',
  openGraphUrl,
  '<meta property="og:title" content="Sergio Morales Rodríguez — Tech Lead Full Stack">',
  `<meta property="og:description" content="${expectedDescription}">`,
  '<meta property="og:image" content="https://sgmr.dev/og.jpg">',
].join('\n    ')
const extraHead = (path: string) => {
  const language = getLanguage(path)
  const paths = getAlternatePaths(path)
  return (
    `<meta name="robots" content="index, follow"><meta property="og:locale" content="${language === 'es' ? 'es_ES' : 'en_US'}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
    ['es', 'en', 'x-default']
      .map(
        (lang) =>
          `<link rel="alternate" hreflang="${lang}" href="${new URL(paths[lang === 'en' ? 'en' : 'es'], SITE_URL)}">`,
      )
      .join('')
  )
}
const navigation = (path: string) => {
  const paths = getAlternatePaths(path)
  const language = getLanguage(path)
  return (
    (['es', 'en'] as const)
      .map(
        (lang) =>
          `<a data-language-link hreflang="${lang}" href="${paths[lang]}" ${lang === language ? 'aria-current="page"' : ''}>${lang}</a>`,
      )
      .join('') + `<a href="${PROFESSIONAL_PROFILE.links.mail}">Contact</a>`
  )
}
const projectLinks = (language: 'es' | 'en') =>
  PROFESSIONAL_PROFILE.projects
    .map(
      (project) =>
        `<a href="${project.kind === 'case-study' ? getAlternatePaths(`/proyectos/${project.id}`)[language] : project.evidenceUrl}">${project.title[language]}</a>`,
    )
    .join('')

const seoMetadata = [
  expectedTitle,
  descriptionMeta,
  canonicalLink,
  openGraphMetadata,
].join('\n    ')

const validHtml = `<!doctype html>
<html lang="es">
  <head>
    ${seoMetadata}
    ${personStructuredData}
    ${extraHead('/')}
  </head>
  <body>
    <h1>Sergio Morales Rodríguez</h1>
    <p>Las Palmas, España</p>
    ${navigation('/')}${projectLinks('es')}
    <section data-lang-content="es">
      <p>${educationLine}</p>
      <p>Evidencia:</p>
      <a ${spanishCvHref}>CV</a>
    </section>
    <a href="https://www.linkedin.com/in/sergiogmr/">LinkedIn</a>
    <a href="https://github.com/sergiogmr">GitHub</a>
  </body>
</html>`

const expectedSitemapLocations = INDEXABLE_PATHS.map((path) =>
  new URL(path, SITE_URL).toString(),
)

const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${expectedSitemapLocations
  .map((location) => `  <url><loc>${location}</loc></url>`)
  .join('\n')}
</urlset>`

function routeFixture(path: string): string {
  const language = getLanguage(path)
  const isHome = path === '/' || path === '/en'
  const app = path.includes('/acezone/')
    ? 'acezone'
    : path.includes('/wattly/')
      ? 'wattly'
      : null
  const project = PROFESSIONAL_PROFILE.projects.find(
    (project) =>
      project.kind === 'case-study' && path.endsWith(`/${project.id}`),
  )
  const entry = isHome
    ? PAGE_METADATA.home[language]
    : app
      ? PAGE_METADATA[app][language]
      : project?.kind === 'case-study'
        ? createCaseStudyMetadata(project)[language]
        : null
  if (!entry) throw new Error(`Unknown fixture ${path}`)
  const body = isHome
    ? `<h1>Sergio Morales Rodríguez</h1><p>${PROFESSIONAL_PROFILE.person.location[language]}</p><section data-lang-content="${language}"><p>${educationLine}</p><p>${language === 'es' ? 'Evidencia:' : 'Evidence:'}</p><a href="/sergio-morales-${language}.pdf">CV</a></section><a href="https://www.linkedin.com/in/sergiogmr/">LinkedIn</a><a href="https://github.com/sergiogmr">GitHub</a>${projectLinks(language)}`
    : project?.kind === 'case-study'
      ? `<h1>${project.title[language]}</h1>${['problem', 'responsibility', 'solution', 'result'].map((field) => `<p>${project[field as 'problem'][language]}</p>`).join('')}${project.technologies.join(' ')}<a href="${project.evidenceUrl}">Project</a>`
      : `<h1>${app} terms</h1>`
  const url = new URL(path, SITE_URL).toString()
  return `<!doctype html><html lang="${language}"><head><title>${entry.title}</title><meta name="description" content="${entry.description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${entry.title}"><meta property="og:description" content="${entry.description}"><meta property="og:image" content="${SITE_URL}/og.jpg">${extraHead(path)}<script type="application/ld+json">${JSON.stringify(entry.schema)}</script></head><body>${navigation(path)}${body}</body></html>`
}

function moveMarkupToBody(html: string, markup: string): string {
  return html.replace(markup, '').replace('</body>', `${markup}</body>`)
}

function addLastModifiedValue(sitemap: string, value: string): string {
  return sitemap.replace('</url>', `<lastmod>${value}</lastmod></url>`)
}

afterEach(async () => {
  await Promise.all(
    fixtureRoots.splice(0).map((root) => rm(root, { recursive: true })),
  )
})

async function runVerifier(
  indexHtml: string,
  sitemapXml = validSitemap,
  mutateFixture?: (fixtureRoot: string) => Promise<void>,
): Promise<{ exitCode: number; output: string }> {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'portfolio-output-'))
  fixtureRoots.push(fixtureRoot)

  await Promise.all([
    mkdir(join(fixtureRoot, 'scripts'), { recursive: true }),
    mkdir(join(fixtureRoot, 'dist'), { recursive: true }),
    mkdir(join(fixtureRoot, 'dist', 'acezone', 'tos'), { recursive: true }),
    mkdir(join(fixtureRoot, 'dist', 'wattly', 'tos'), { recursive: true }),
    mkdir(join(fixtureRoot, 'public'), { recursive: true }),
  ])

  const verifierSource = await readFile(
    new URL('verify-portfolio-output.ts', import.meta.url),
    'utf8',
  )

  await Promise.all([
    writeFile(
      join(fixtureRoot, 'scripts', 'verify-portfolio-output.ts'),
      verifierSource,
    ),
    writeFile(join(fixtureRoot, 'dist', 'index.html'), indexHtml),
    writeFile(join(fixtureRoot, 'dist', 'sitemap.xml'), sitemapXml),
    writeFile(
      join(fixtureRoot, 'dist', 'acezone', 'tos', 'index.html'),
      '<!doctype html><html><head></head><body>AceZone</body></html>',
    ),
    writeFile(
      join(fixtureRoot, 'dist', 'wattly', 'tos', 'index.html'),
      '<!doctype html><html><head></head><body>Wattly</body></html>',
    ),
    ...['es', 'en'].flatMap((locale) => [
      copyFile(
        new URL(`public/sergio-morales-${locale}.pdf`, projectRoot),
        join(fixtureRoot, 'public', `sergio-morales-${locale}.pdf`),
      ),
      copyFile(
        new URL(`public/sergio-morales-${locale}.pdf`, projectRoot),
        join(fixtureRoot, 'dist', `sergio-morales-${locale}.pdf`),
      ),
      copyFile(
        new URL(`public/sergio-morales-2024-${locale}.pdf`, projectRoot),
        join(fixtureRoot, 'public', `sergio-morales-2024-${locale}.pdf`),
      ),
      copyFile(
        new URL(`public/sergio-morales-2024-${locale}.pdf`, projectRoot),
        join(fixtureRoot, 'dist', `sergio-morales-2024-${locale}.pdf`),
      ),
    ]),
  ])

  await cp(
    new URL('../src/lib', import.meta.url),
    join(fixtureRoot, 'src', 'lib'),
    { recursive: true },
  )
  for (const path of INDEXABLE_PATHS.filter((path) => path !== '/')) {
    const directory = join(fixtureRoot, 'dist', path)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'index.html'), routeFixture(path))
  }
  await mkdir(join(fixtureRoot, '.vercel', 'output'), { recursive: true })
  await writeFile(
    join(fixtureRoot, '.vercel', 'output', 'config.json'),
    JSON.stringify({
      version: 3,
      routes: [
        { src: '^/(.*)/$', headers: { Location: '/$1' }, status: 308 },
        { handle: 'filesystem' },
        { src: '^/.*$', dest: '/404.html', status: 404 },
      ],
    }),
  )
  await writeFile(
    join(fixtureRoot, 'dist', '404.html'),
    '<!doctype html><html lang="en"><head><title>Not Found</title><meta name="robots" content="noindex, follow"></head><body><h1>Not Found</h1></body></html>',
  )
  await copyFile(
    new URL('../public/og.jpg', import.meta.url),
    join(fixtureRoot, 'dist', 'og.jpg'),
  )
  await cp(
    join(fixtureRoot, 'dist'),
    join(fixtureRoot, '.vercel', 'output', 'static'),
    { recursive: true },
  )
  await mutateFixture?.(fixtureRoot)

  const process = Bun.spawn(
    ['bun', join(fixtureRoot, 'scripts', 'verify-portfolio-output.ts')],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])

  return { exitCode, output: `${stdout}${stderr}` }
}

describe('portfolio output verifier', () => {
  test('accepts a complete independently retrievable bilingual portfolio', async () => {
    const result = await runVerifier(validHtml)
    expect(result.exitCode).toBe(0)
  })

  test('rejects www canonical even when the fixture site config also uses www', async () => {
    const result = await runVerifier(
      validHtml.replaceAll('https://sgmr.dev', 'https://www.sgmr.dev'),
      validSitemap,
      async (fixtureRoot) => {
        const sitePath = join(fixtureRoot, 'src', 'lib', 'site.ts')
        const site = await readFile(sitePath, 'utf8')
        await writeFile(
          sitePath,
          site.replaceAll('https://sgmr.dev', 'https://www.sgmr.dev'),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('canonical link')
  })

  test('rejects alternates that point both languages to the same page', async () => {
    const html = validHtml.replace(
      'hreflang="en" href="https://sgmr.dev/en"',
      'hreflang="en" href="https://sgmr.dev/"',
    )
    const result = await runVerifier(html)
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('language alternates')
  })

  test('rejects duplicate H1 headings', async () => {
    const result = await runVerifier(
      validHtml.replace('</body>', '<h1>First</h1><h1>Second</h1></body>'),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('H1')
  })

  test('rejects an internal link to a page that was not emitted', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '</body>',
        '<a href="/missing-page">Missing</a></body>',
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('internal navigation')
  })

  test('rejects an internal link to an absent section', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '</body>',
        '<a href="/en#missing-section">Missing</a></body>',
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('internal navigation')
  })

  test('rejects mixed-language initial HTML on a language URL', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '</body>',
        '<p data-lang-content="en">English-only content</p></body>',
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('URL locale')
  })

  test('rejects a case study missing its factual responsibility', async () => {
    const project = PROFESSIONAL_PROFILE.projects[0]
    if (project?.kind !== 'case-study')
      throw new Error('Missing case study fixture')
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', 'proyectos', 'jauntjar', 'index.html'),
          routeFixture('/proyectos/jauntjar').replace(
            `<p>${project.responsibility.es}</p>`,
            '<p>Unsupported replacement</p>',
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('case-study responsibility')
  })

  test('rejects a 404 with an indexable canonical', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', '404.html'),
          '<!doctype html><html><head><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://sgmr.dev/404"></head><body><h1>Not found</h1></body></html>',
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('404 discovery metadata')
  })

  test('rejects a hosting fallback that turns missing pages into HTTP 200', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        const configPath = join(fixtureRoot, '.vercel', 'output', 'config.json')
        await writeFile(
          configPath,
          (await readFile(configPath, 'utf8')).replace(
            '"status":404',
            '"status":200',
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Vercel 404 route')
  })

  test('keeps the output verification gate in the Vercel build command', async () => {
    const vercelConfig = JSON.parse(
      await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
    ) as { buildCommand?: string }

    expect(vercelConfig.buildCommand).toBe('bun run build')
  })

  test('rejects a corrupted emitted PDF when public sources are correct', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', 'sergio-morales-es.pdf'),
          '%PDF-corrupt',
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('ES stable CV')
  })

  test('rejects a missing emitted PDF alias when public sources are correct', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await rm(join(fixtureRoot, 'dist', 'sergio-morales-2024-en.pdf'))
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('EN 2024 CV alias')
  })

  test('rejects a sitemap route without its emitted HTML artifact', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await rm(join(fixtureRoot, 'dist', 'acezone', 'tos', 'index.html'))
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap route artifact')
  })

  test('rejects a sitemap route whose HTML structure exists only in a comment', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', 'acezone', 'tos', 'index.html'),
          '<!-- <!doctype html><html><head></head><body></body></html> -->',
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap route artifact')
  })

  test('rejects an expected title that exists only in an HTML comment', async () => {
    const html = validHtml.replace(
      expectedTitle,
      `<title>Wrong title</title><!-- ${expectedTitle} -->`,
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('page title')
  })

  test('rejects an expected CV href that exists only in an HTML comment', async () => {
    const html = validHtml.replace(
      spanishCvHref,
      `href="/missing-es.pdf"><!-- <a ${spanishCvHref}>Hidden CV</a> -->`,
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Spanish CV link')
  })

  test('rejects an English CV served on the Spanish URL', async () => {
    const html = validHtml.replace(spanishCvHref, englishCvHref)
    const result = await runVerifier(html)
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Spanish CV link')
  })

  test('rejects an English stable CV link added to the Spanish scope', async () => {
    const html = validHtml.replace(
      `<a ${spanishCvHref}>CV</a>`,
      `<a ${spanishCvHref}>CV</a><a ${englishCvHref}>Wrong CV</a>`,
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Spanish CV link')
  })

  test('rejects a Spanish stable CV link added to the English page', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', 'en', 'index.html'),
          routeFixture('/en').replace(
            `<a ${englishCvHref}>CV</a>`,
            `<a ${englishCvHref}>CV</a><a ${spanishCvHref}>Wrong CV</a>`,
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('English CV link')
  })

  test('rejects any active legacy CV href', async () => {
    const html = validHtml.replace(
      '</body>',
      '<a href="/sergio-morales-2024-es.pdf">Legacy CV</a></body>',
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('legacy CV link')
  })

  test('rejects a legacy CV href with uppercase characters', async () => {
    const html = validHtml.replace(
      '</body>',
      '<a href="/SERGIO-MORALES-2024-ES.PDF">Legacy CV</a></body>',
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('legacy CV link')
  })

  test('rejects a percent-encoded legacy CV href', async () => {
    const html = validHtml.replace(
      '</body>',
      '<a href="/sergio-morales-%32%30%32%34-es.pdf">Legacy CV</a></body>',
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('legacy CV link')
  })

  test('rejects Person structured data inside inert template content', async () => {
    const html = validHtml.replace(
      personStructuredData,
      `<template>${personStructuredData}</template>`,
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Person structured data')
  })

  test('rejects duplicate active description metadata', async () => {
    const html = validHtml.replace(
      descriptionMeta,
      `${descriptionMeta}${descriptionMeta}`,
    )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('meta description')
  })

  test('rejects SEO metadata inside a second head nested in body', async () => {
    const html = validHtml
      .replace(seoMetadata, '')
      .replace('<body>', `<body><head>${seoMetadata}</head>`)

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('document head')
  })

  test('rejects a page title outside head', async () => {
    const result = await runVerifier(moveMarkupToBody(validHtml, expectedTitle))

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('page title')
  })

  test('rejects a description outside head', async () => {
    const result = await runVerifier(
      moveMarkupToBody(validHtml, descriptionMeta),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('meta description')
  })

  test('rejects a canonical link outside head', async () => {
    const result = await runVerifier(moveMarkupToBody(validHtml, canonicalLink))

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('canonical link')
  })

  test('rejects Open Graph metadata outside head', async () => {
    const result = await runVerifier(
      moveMarkupToBody(validHtml, openGraphMetadata),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Open Graph')
  })

  test('rejects localized content outside empty language containers', async () => {
    const html = validHtml
      .replace(
        'data-lang-content="es"',
        'data-lang-content="es"></section><section',
      )
      .replace(
        'data-lang-content="en"',
        'data-lang-content="en"></section><section',
      )

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('localized education')
  })

  test('rejects output without its canonical link', async () => {
    const html = validHtml.replace(canonicalLink, '')

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('canonical link')
  })

  test('rejects output without required Open Graph metadata', async () => {
    const html = validHtml.replace(openGraphUrl, '')

    const result = await runVerifier(html)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('Open Graph URL')
  })

  test('rejects sitemap locations that exist only in comments', async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!--
${expectedSitemapLocations
  .map((location) => `  <url><loc>${location}</loc></url>`)
  .join('\n')}
  -->
</urlset>`

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap locations mismatch')
  })

  test('rejects sitemap locations outside url entries', async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${expectedSitemapLocations
  .map((location) => `  <loc>${location}</loc>`)
  .join('\n')}
</urlset>`

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap locations mismatch')
  })

  test('rejects sitemap entries without exactly one direct location', async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${expectedSitemapLocations[0]}</loc>
    <loc>${expectedSitemapLocations[1]}</loc>
  </url>
  <url></url>
  <url><loc>${expectedSitemapLocations[2]}</loc></url>
</urlset>`

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap locations mismatch')
  })

  test('rejects sitemap locations containing descendant elements', async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${expectedSitemapLocations
  .map((location) => `  <url><loc><span>${location}</span></loc></url>`)
  .join('\n')}
</urlset>`

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap locations mismatch')
  })

  test('rejects a sitemap with an unclosed root element', async () => {
    const sitemap = validSitemap.replace('</urlset>', '')

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects sitemap element names with the wrong case', async () => {
    const sitemap = validSitemap
      .replaceAll('urlset', 'URLSET')
      .replaceAll('url', 'URL')
      .replaceAll('loc', 'LOC')

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects XML comments containing a double hyphen', async () => {
    const sitemap = validSitemap.replace(
      '\n<urlset',
      '\n<!-- invalid -- comment -->\n<urlset',
    )

    const result = await runVerifier(validHtml, sitemap)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects an XML comment before the declaration', async () => {
    const result = await runVerifier(
      validHtml,
      `<!-- prefix -->${validSitemap}`,
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects whitespace before the XML declaration', async () => {
    const result = await runVerifier(validHtml, ` \n${validSitemap}`)

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects unknown XML entities', async () => {
    const result = await runVerifier(
      validHtml,
      addLastModifiedValue(validSitemap, '&unknown;'),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects raw ampersands in XML text', async () => {
    const result = await runVerifier(
      validHtml,
      addLastModifiedValue(validSitemap, '2026&07'),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })

  test('rejects invalid XML control characters', async () => {
    const result = await runVerifier(
      validHtml,
      addLastModifiedValue(validSitemap, '\u0001'),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
  })
})
