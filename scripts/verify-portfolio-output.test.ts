import { afterEach, describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
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

import sharp from 'sharp'

import {
  CASE_STUDY_IDS,
  INDEXABLE_PATHS,
  PAGE_LAST_MODIFIED,
  SITE_URL,
  getAlternatePaths,
  getLanguage,
} from '../src/lib/site'
import {
  PAGE_METADATA,
  createCaseStudyMetadata,
} from '../src/lib/page-metadata'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'
import {
  verifyContentSecurityPolicy,
  verifyHeadPreamble,
} from './verify-portfolio-output'

const projectRoot = new URL('../', import.meta.url)
const fixtureRoots: string[] = []

const educationLine = 'I.E.S. El Rincón · 2016 — 2018 · EQF/MEC 5'
const expectedTitle =
  '<title>Sergio Morales Rodríguez — Tech Lead Full Stack | Laravel</title>'
const spanishCvHref = 'href="/sergio-morales-es.pdf"'
const englishCvHref = 'href="/sergio-morales-en.pdf"'
const personStructuredData = `<script type="application/ld+json">${JSON.stringify(PAGE_METADATA.home.es.schema)}</script>`
const expectedDescription =
  'Sergio Morales Rodríguez, Tech Lead Full Stack en Las Palmas. Arquitectura y desarrollo web con Laravel, APIs y coordinación de desarrollo y DevOps.'
const descriptionMeta = `<meta name="description" content="${expectedDescription}">`
const canonicalLink = '<link rel="canonical" href="https://sgmr.dev/">'
const openGraphUrl = '<meta property="og:url" content="https://sgmr.dev/">'
const openGraphMetadata = [
  '<meta property="og:type" content="website">',
  openGraphUrl,
  '<meta property="og:title" content="Sergio Morales Rodríguez — Tech Lead Full Stack | Laravel">',
  `<meta property="og:description" content="${expectedDescription}">`,
  '<meta property="og:image" content="https://sgmr.dev/og.jpg">',
].join('\n    ')
const cspHash = (content: string) =>
  `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`
// Resolves to the rejection message, or fails the test when the promise resolves.
const rejectionOf = (promise: Promise<unknown>): Promise<string> =>
  promise.then(
    () => {
      throw new Error('expected the promise to reject')
    },
    (error: unknown) =>
      error instanceof Error ? error.message : String(error),
  )
const baseCspDirectives = [
  "default-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
// The charset and viewport must open the head, within the first 1024 bytes.
const headPreamble =
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
// The meta tag Astro emits, with the hashes of the fixture's inline code.
const cspMeta = ({
  scripts = [],
  styles = [],
  directives = baseCspDirectives,
  scriptSources = [`'self'`],
  styleSources = [`'self'`],
}: {
  scripts?: string[]
  styles?: string[]
  directives?: string[]
  scriptSources?: string[]
  styleSources?: string[]
} = {}) =>
  `<meta http-equiv="content-security-policy" content="${[
    ...directives,
    `script-src ${[...scriptSources, ...scripts.map(cspHash)].join(' ')}`,
    `style-src ${[...styleSources, ...styles.map(cspHash)].join(' ')}`,
  ].join('; ')};">`
const themeScript = 'document.documentElement.classList.add("dark")'
const isCaseStudyPath = (path: string) =>
  /^\/(?:en\/projects|proyectos)\//.test(path)
const WEBP_CARD = { width: 1200, height: 630 } as const
// Case studies point at an emitted WebP; every other page keeps og.jpg.
const socialCard = (path: string) =>
  isCaseStudyPath(path)
    ? {
        url: `${SITE_URL}/_astro/${path.split('/').at(-1)}.test1234.webp`,
        type: 'image/webp',
        ...WEBP_CARD,
      }
    : {
        url: `${SITE_URL}/og.jpg`,
        type: 'image/jpeg',
        width: 1200,
        height: 630,
      }
const iconHead =
  '<link rel="icon" type="image/avif" href="/favicon.avif"><link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">'
const twitterHead = (path: string) => {
  const card = socialCard(path)
  const entry = metadataFor(path)
  return [
    ['twitter:card', 'summary_large_image'],
    ['twitter:url', new URL(path, SITE_URL).toString()],
    ['twitter:title', entry.title],
    ['twitter:description', entry.description],
    ['twitter:image', card.url],
    ['twitter:image:alt', entry.imageAlt],
    ['twitter:site', '@sergiogmr'],
    ['twitter:creator', '@sergiogmr'],
  ]
    .map(([name, value]) => `<meta name="${name}" content="${value}">`)
    .join('')
}
const extraHead = (path: string) => {
  const language = getLanguage(path)
  const paths = getAlternatePaths(path)
  const card = socialCard(path)
  return (
    `<meta name="robots" content="index, follow"><meta property="og:locale" content="${language === 'es' ? 'es_ES' : 'en_US'}"><meta property="og:locale:alternate" content="${language === 'es' ? 'en_US' : 'es_ES'}"><meta property="og:image:type" content="${card.type}"><meta property="og:image:width" content="${card.width}"><meta property="og:image:height" content="${card.height}"><meta property="og:image:alt" content="${metadataFor(path).imageAlt}">` +
    twitterHead(path) +
    iconHead +
    ['es', 'en', 'x-default']
      .map(
        (lang) =>
          `<link rel="alternate" hreflang="${lang}" href="${new URL(paths[lang === 'en' ? 'en' : 'es'], SITE_URL)}">`,
      )
      .join('')
  )
}
function metadataFor(path: string) {
  const language = getLanguage(path)
  const isHome = path === '/' || path === '/en'
  const app = path.includes('/acezone/')
    ? 'acezone'
    : path.includes('/wattly/')
      ? 'wattly'
      : null
  const project = PROFESSIONAL_PROFILE.projects.find((project) =>
    path.endsWith(`/${project.id}`),
  )
  const entry = isHome
    ? PAGE_METADATA.home[language]
    : app
      ? PAGE_METADATA[app][language]
      : project
        ? createCaseStudyMetadata(project)[language]
        : null
  if (!entry) throw new Error(`Unknown fixture ${path}`)
  return entry
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
        `<a href="${getAlternatePaths(`/proyectos/${project.id}`)[language]}">${project.title[language]}</a>`,
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
    ${headPreamble}
    <script>${themeScript}</script>
    ${cspMeta({ scripts: [themeScript] })}
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
  .map(
    (location, index) =>
      `  <url><loc>${location}</loc><lastmod>${PAGE_LAST_MODIFIED[INDEXABLE_PATHS[index]!]}</lastmod></url>`,
  )
  .join('\n')}
</urlset>`

const cvAliasRedirects = (['es', 'en'] as const).map((locale) => ({
  src: `^/sergio-morales-2024-${locale}\\.pdf$`,
  headers: { Location: `/sergio-morales-${locale}.pdf` },
  status: 301,
}))

function routeFixture(path: string): string {
  const language = getLanguage(path)
  const isHome = path === '/' || path === '/en'
  const app = path.includes('/acezone/')
    ? 'acezone'
    : path.includes('/wattly/')
      ? 'wattly'
      : null
  const project = PROFESSIONAL_PROFILE.projects.find((project) =>
    path.endsWith(`/${project.id}`),
  )
  const entry = metadataFor(path)
  const body = isHome
    ? `<h1>Sergio Morales Rodríguez</h1><p>${PROFESSIONAL_PROFILE.person.location[language]}</p><section data-lang-content="${language}"><p>${educationLine}</p><p>${language === 'es' ? 'Evidencia:' : 'Evidence:'}</p><a href="/sergio-morales-${language}.pdf">CV</a></section><a href="https://www.linkedin.com/in/sergiogmr/">LinkedIn</a><a href="https://github.com/sergiogmr">GitHub</a>${projectLinks(language)}`
    : project
      ? `<h1>${project.title[language]}</h1>${['problem', 'responsibility', 'solution', 'result'].map((field) => `<p>${project[field as 'problem'][language]}</p>`).join('')}<ul>${project.tasks[language].map((task) => `<li>${task}</li>`).join('')}</ul>${project.technologies.join(' ')}<a href="${project.evidenceUrl}">Project</a>`
      : `<h1>${app} terms</h1>`
  const url = new URL(path, SITE_URL).toString()
  return `<!doctype html><html lang="${language}"><head>${headPreamble}${cspMeta()}<title>${entry.title}</title><meta name="description" content="${entry.description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${entry.title}"><meta property="og:description" content="${entry.description}"><meta property="og:image" content="${socialCard(path).url}">${extraHead(path)}<script type="application/ld+json">${JSON.stringify(entry.schema)}</script></head><body>${navigation(path)}${body}</body></html>`
}

function moveMarkupToBody(html: string, markup: string): string {
  return html.replace(markup, '').replace('</body>', `${markup}</body>`)
}

async function writeOutputConfig(
  fixtureRoot: string,
  mutate: (
    routes: {
      src?: string
      status?: number
      headers?: { Location?: string }
    }[],
  ) => unknown[],
): Promise<void> {
  const configPath = join(fixtureRoot, '.vercel', 'output', 'config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as {
    routes: Parameters<typeof mutate>[0]
  }
  await writeFile(
    configPath,
    JSON.stringify({ ...config, routes: mutate(config.routes) }),
  )
}

function addLastModifiedValue(sitemap: string, value: string): string {
  return sitemap.replace(
    /<lastmod>[^<]*<\/lastmod>/,
    `<lastmod>${value}</lastmod>`,
  )
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
        ...cvAliasRedirects,
        { handle: 'filesystem' },
        { src: '^/.*$', dest: '/404.html', status: 404 },
      ],
    }),
  )
  await writeFile(
    join(fixtureRoot, 'dist', '404.html'),
    `<!doctype html><html lang="en"><head>${headPreamble}${cspMeta()}<title>Not Found</title><meta name="robots" content="noindex, follow"></head><body><h1>Not Found</h1></body></html>`,
  )
  await copyFile(
    new URL('../public/og.jpg', import.meta.url),
    join(fixtureRoot, 'dist', 'og.jpg'),
  )
  for (const asset of [
    'favicon.ico',
    'favicon-96x96.png',
    'apple-touch-icon.png',
    'sergio-morales-avatar.png',
  ])
    await copyFile(
      new URL(`../public/${asset}`, import.meta.url),
      join(fixtureRoot, 'dist', asset),
    )
  await mkdir(join(fixtureRoot, 'dist', '_astro'), { recursive: true })
  const webp = await sharp({
    create: { ...WEBP_CARD, channels: 3, background: '#223344' },
  })
    .webp()
    .toBuffer()
  for (const id of CASE_STUDY_IDS)
    await writeFile(
      join(fixtureRoot, 'dist', '_astro', `${id}.test1234.webp`),
      webp,
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

  test('rejects a case study that omits one of its concrete tasks', async () => {
    const project = PROFESSIONAL_PROFILE.projects.find(
      ({ id }) => id === 'wattly',
    )!
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(fixtureRoot, 'dist', 'en', 'projects', 'wattly', 'index.html'),
          routeFixture('/en/projects/wattly').replace(
            `<li>${project.tasks.en[0]}</li>`,
            '',
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('case-study task')
  })

  test('rejects a former showcase page without its project link', async () => {
    const project = PROFESSIONAL_PROFILE.projects.find(
      ({ id }) => id === 'uploadimg-desktop',
    )!
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(
          join(
            fixtureRoot,
            'dist',
            'proyectos',
            'uploadimg-desktop',
            'index.html',
          ),
          routeFixture('/proyectos/uploadimg-desktop').replace(
            `<a href="${project.evidenceUrl}">Project</a>`,
            '',
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('project website link')
  })

  const routeFile = (fixtureRoot: string, path: string) =>
    join(fixtureRoot, 'dist', path, 'index.html')
  const rewriteRoute =
    (
      path: string,
      rewrite: (html: string) => string,
    ): ((fixtureRoot: string) => Promise<void>) =>
    async (fixtureRoot) => {
      const file = routeFile(fixtureRoot, path)
      await writeFile(file, rewrite(await readFile(file, 'utf8')))
    }

  test('rejects twitter tags that use the property attribute', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en', (html) =>
        html.replace(
          '<meta name="twitter:title"',
          '<meta property="twitter:title"',
        ),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('twitter:title')
  })

  test('rejects the redundant googlebot meta', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '</head>',
        '<meta name="googlebot" content="index, follow"></head>',
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('googlebot')
  })

  test('rejects a page without its alternate Open Graph locale', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en', (html) =>
        html.replace(/<meta property="og:locale:alternate"[^>]*>/, ''),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('og:locale:alternate')
  })

  test('rejects a page without the apple touch icon link', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en', (html) =>
        html.replace(/<link rel="apple-touch-icon"[^>]*>/, ''),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('apple-touch-icon')
  })

  test('rejects an icon file with the wrong dimensions', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await sharp({
          create: { width: 64, height: 64, channels: 4, background: '#fff' },
        })
          .png()
          .toFile(join(fixtureRoot, 'dist', 'apple-touch-icon.png'))
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('apple-touch-icon.png')
  })

  test('rejects a favicon.ico that is not a 32x32 ICO', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeFile(join(fixtureRoot, 'dist', 'favicon.ico'), 'not an icon')
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('favicon.ico')
  })

  test('rejects a case-study card that was not emitted', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await rm(join(fixtureRoot, 'dist', '_astro', 'jauntjar.test1234.webp'))
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('social card')
  })

  test('accepts a well-formed heading outline on the home page', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '</body>',
        '<h2>A</h2><h3>B</h3><h3>C</h3><h2>D</h2><h3>E</h3></body>',
      ),
    )
    expect(result.exitCode).toBe(0)
  })

  test('rejects a skipped heading level on the home page', async () => {
    const result = await runVerifier(
      validHtml.replace('</body>', '<h2>A</h2><h4>Skipped</h4></body>'),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('heading order')
    expect(result.output).toContain('h4')
  })

  test('rejects a heading that appears before the H1', async () => {
    const result = await runVerifier(
      validHtml.replace('<h1>', '<h2>Early</h2><h1>'),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('heading order')
  })

  test('rejects a skipped heading level on the English home page', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en', (html) =>
        html.replace('</body>', '<h2>A</h2><h3>B</h3><h5>Skipped</h5></body>'),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('heading order')
    expect(result.output).toContain('/en')
  })

  test('rejects a skipped heading level on a case-study page', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en/projects/todo-lux', (html) =>
        html.replace('</body>', '<h3>Skipped</h3></body>'),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('heading order')
    expect(result.output).toContain('/en/projects/todo-lux')
  })

  test('rejects a case-study card whose real size differs from its meta tags', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/proyectos/jauntjar', (html) =>
        html.replace(
          `<meta property="og:image:width" content="${WEBP_CARD.width}">`,
          '<meta property="og:image:width" content="900">',
        ),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('social card dimensions')
  })

  test('rejects a case-study card that is not 1200x630 even when its meta tags agree', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        const small = await sharp({
          create: {
            width: 900,
            height: 480,
            channels: 3,
            background: '#223344',
          },
        })
          .webp()
          .toBuffer()
        await writeFile(
          join(fixtureRoot, 'dist', '_astro', 'todo-lux.test1234.webp'),
          small,
        )
        for (const path of ['/proyectos/todo-lux', '/en/projects/todo-lux'])
          await rewriteRoute(path, (html) =>
            html
              .replace(
                `<meta property="og:image:width" content="${WEBP_CARD.width}">`,
                '<meta property="og:image:width" content="900">',
              )
              .replace(
                `<meta property="og:image:height" content="${WEBP_CARD.height}">`,
                '<meta property="og:image:height" content="480">',
              ),
          )(fixtureRoot)
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('1200x630')
  })

  test('rejects a case study that still uses the generic JPEG card', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/en/projects/todo-lux', (html) =>
        html
          .replaceAll(
            socialCard('/en/projects/todo-lux').url,
            `${SITE_URL}/og.jpg`,
          )
          .replace('content="image/webp"', 'content="image/jpeg"'),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('og:image')
  })

  test('rejects a case-study card whose twitter image differs from og:image', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      rewriteRoute('/proyectos/basuraleza', (html) =>
        html.replace(
          /<meta name="twitter:image" content="[^"]*">/,
          `<meta name="twitter:image" content="${SITE_URL}/og.jpg">`,
        ),
      ),
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('twitter:image')
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

  test('accepts the emitted permanent CV alias redirects without alias files', async () => {
    const result = await runVerifier(validHtml)

    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('permanent CV alias redirects')
  })

  test('rejects a legacy 2024 CV file that is still emitted', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await copyFile(
          join(fixtureRoot, 'dist', 'sergio-morales-en.pdf'),
          join(fixtureRoot, 'dist', 'sergio-morales-2024-en.pdf'),
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('EN 2024 CV alias')
    expect(result.output).toContain('must not be emitted')
  })

  test('rejects a missing legacy CV alias redirect', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeOutputConfig(fixtureRoot, (routes) =>
          routes.filter((route) => route.src !== cvAliasRedirects[1]!.src),
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('EN 2024 CV alias redirect')
  })

  test('rejects a temporary legacy CV alias redirect', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeOutputConfig(fixtureRoot, (routes) =>
          routes.map((route) =>
            route.src === cvAliasRedirects[0]!.src
              ? { ...route, status: 302 }
              : route,
          ),
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('ES 2024 CV alias redirect')
  })

  test('rejects a legacy CV alias redirect to the wrong destination', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        await writeOutputConfig(fixtureRoot, (routes) =>
          routes.map((route) =>
            route.src === cvAliasRedirects[0]!.src
              ? { ...route, headers: { Location: '/sergio-morales-en.pdf' } }
              : route,
          ),
        )
      },
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('ES 2024 CV alias redirect')
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

  test('rejects a sitemap url without a last modification date', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap.replace(/<lastmod>[^<]*<\/lastmod>/, ''),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('sitemap')
    expect(result.output).toContain('lastmod')
  })

  test('rejects a sitemap url with a duplicated last modification date', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap.replace(
        '</url>',
        `<lastmod>${PAGE_LAST_MODIFIED['/']}</lastmod></url>`,
      ),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('lastmod')
  })

  test('rejects a sitemap last modification date that differs from the page date', async () => {
    const result = await runVerifier(
      validHtml,
      addLastModifiedValue(validSitemap, '2020-01-01'),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('lastmod')
  })

  test('rejects a sitemap last modification date that is not YYYY-MM-DD', async () => {
    const result = await runVerifier(
      validHtml,
      addLastModifiedValue(validSitemap, '2026-10-22T10:00:00Z'),
    )

    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('lastmod')
  })

  test('rejects ignored changefreq and priority sitemap elements', async () => {
    for (const element of [
      '<changefreq>monthly</changefreq>',
      '<priority>0.8</priority>',
    ]) {
      const result = await runVerifier(
        validHtml,
        validSitemap.replace('</url>', `${element}</url>`),
      )

      expect(result.exitCode).not.toBe(0)
      expect(result.output).toContain('sitemap')
    }
  })
})

describe('portfolio output verifier: content security policy', () => {
  const validCsp = cspMeta({ scripts: [themeScript] })
  const withHead = (markup: string) =>
    validHtml.replace(validCsp, `${validCsp}${markup}`)
  const withCsp = (meta: string) => validHtml.replace(validCsp, meta)
  const reject = async (html: string, message: string) => {
    const result = await runVerifier(html)
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain(message)
  }

  test('accepts hashed inline code, JSON-LD data blocks and same-origin scripts', async () => {
    const script = 'window.revealed = true'
    const style = '.prose{max-width:65ch}'
    const html = withCsp(
      cspMeta({ scripts: [themeScript, script], styles: [style] }),
    ).replace(
      '</head>',
      `<script type="module">${script}</script><style>${style}</style><script src="/_astro/page.js" type="module"></script><script src="/_vercel/insights/script.js" defer></script></head>`,
    )
    const result = await runVerifier(html)
    expect(result.exitCode).toBe(0)
  })

  test('rejects a page without a CSP meta', async () => {
    await reject(withCsp(''), 'exactly one content-security-policy meta, got 0')
  })

  test('rejects a second CSP meta', async () => {
    await reject(
      withHead(validCsp),
      'exactly one content-security-policy meta, got 2',
    )
  })

  test('rejects a CSP meta outside head', async () => {
    await reject(
      withCsp('').replace('<body>', `<body>${validCsp}`),
      'CSP meta must be in head',
    )
  })

  test('rejects an executable script that runs before the CSP meta', async () => {
    await reject(
      validHtml.replace(
        `<script>${themeScript}</script>`,
        `<script>${themeScript}</script><script>first()</script>`,
      ),
      'before the CSP meta',
    )
  })

  test("rejects 'unsafe-inline' in script-src", async () => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          scriptSources: [`'self'`, `'unsafe-inline'`],
        }),
      ),
      'script-src may only list',
    )
  })

  test("rejects 'unsafe-eval' in script-src", async () => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          scriptSources: [`'self'`, `'unsafe-eval'`],
        }),
      ),
      'script-src may only list',
    )
  })

  test("rejects 'unsafe-inline' in style-src", async () => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          styleSources: [`'self'`, `'unsafe-inline'`],
        }),
      ),
      'style-src may only list',
    )
  })

  test.each([
    ['a wildcard', '*'],
    ['a scheme', 'https:'],
    ['a third-party host', 'https://cdn.example.com'],
  ])('rejects %s as a script source', async (_label, source) => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          scriptSources: [`'self'`, source],
        }),
      ),
      'script-src may only list',
    )
  })

  test("rejects a script-src without 'self'", async () => {
    await reject(
      withCsp(cspMeta({ scripts: [themeScript], scriptSources: [] })),
      "script-src must allow 'self'",
    )
  })

  test("rejects a style-src without 'self'", async () => {
    await reject(
      withCsp(cspMeta({ scripts: [themeScript], styleSources: [] })),
      "style-src must allow 'self'",
    )
  })

  test.each([
    ['default-src', "default-src 'self'"],
    ['object-src', "object-src 'none'"],
    ['base-uri', "base-uri 'self'"],
    ['form-action', "form-action 'self'"],
  ])('rejects a policy that drops %s', async (name, directive) => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          directives: baseCspDirectives.filter((value) => value !== directive),
        }),
      ),
      `${name} must be exactly`,
    )
  })

  test('rejects an executable inline script without its hash', async () => {
    await reject(
      withHead('<script type="module">unhashed()</script>'),
      'inline script hash',
    )
  })

  test('rejects an inline script whose content changed after hashing', async () => {
    await reject(
      validHtml.replace(
        `<script>${themeScript}</script>`,
        `<script>${themeScript} </script>`,
      ),
      'inline script hash',
    )
  })

  test('rejects an inline style without its hash', async () => {
    await reject(withHead('<style>.a{color:red}</style>'), 'inline style hash')
  })

  test('rejects an inline event handler attribute', async () => {
    await reject(
      validHtml.replace('<h1>', '<h1 onclick="track()">'),
      'inline event handler',
    )
  })

  test('rejects an inline style attribute', async () => {
    await reject(
      validHtml.replace('<h1>', '<h1 style="color:red">'),
      'inline style attribute',
    )
  })

  test('rejects an external script source', async () => {
    await reject(
      withHead('<script src="https://cdn.example.com/lib.js"></script>'),
      'external script',
    )
  })

  test('rejects a protocol-relative script source', async () => {
    await reject(
      withHead('<script src="//cdn.example.com/lib.js"></script>'),
      'external script',
    )
  })

  test("rejects 'data:' in img-src", async () => {
    await reject(
      withCsp(
        cspMeta({
          scripts: [themeScript],
          directives: baseCspDirectives.map((directive) =>
            directive.startsWith('img-src')
              ? "img-src 'self' data:"
              : directive,
          ),
        }),
      ),
      "img-src must be exactly 'self'",
    )
  })

  test('rejects a data: URI in an image', async () => {
    await reject(
      withHead('<img src="data:image/png;base64,AAAA" alt="">'),
      'data: URI',
    )
    await reject(
      withHead(
        '<picture><source srcset="data:image/webp;base64,AAAA"></picture>',
      ),
      'data: URI',
    )
  })

  test.each(['&amp;', '&#x27;none&#x27;', '&'])(
    'rejects %s in the CSP content, which browsers decode and lol-html does not',
    async (reference) => {
      await reject(
        withCsp(
          validCsp.replace(
            "default-src 'self'",
            `default-src 'self'${reference}`,
          ),
        ),
        "must not contain '&'",
      )
    },
  )

  describe('head placement before the CSP meta', () => {
    // A browser closes <head> at the first element that does not belong there
    // and moves the meta into <body>, where the policy is ignored.
    const beforePolicy = (markup: string) =>
      validHtml.replace(validCsp, `${markup}${validCsp}`)

    test.each([
      '<div></div>',
      '<p>x</p>',
      '<img src="/a.png" alt="">',
      '<span></span>',
      '<svg></svg>',
    ])('rejects %s before the CSP meta', async (markup) => {
      await reject(
        beforePolicy(markup),
        'not allowed in head before the CSP meta',
      )
    })

    test.each(['<base href="/">', '<base target="_blank">', '<BASE HREF="/">'])(
      'rejects %s before the CSP meta',
      async (markup) => {
        await reject(
          beforePolicy(markup),
          '<base> is not allowed in head before the CSP meta',
        )
      },
    )

    test.each([
      '<link rel="stylesheet" href="https://evil.example/a.css">',
      '<link rel="preload" href="//evil.example/a.css" as="style">',
      '<link rel="stylesheet" href="/\\evil.example/a.css">',
      '<link rel="stylesheet" href="http://sgmr.dev/a.css">',
      '<link rel="stylesheet" href="https://www.sgmr.dev/a.css">',
    ])('rejects the cross-origin %s before the CSP meta', async (markup) => {
      await reject(beforePolicy(markup), 'cross-origin <link>')
    })

    // lol-html reads `<title/>`, `<script/>` and the like as open tags, as a
    // browser does, so they swallow the meta and the policy count catches them.
    test.each([
      '<title/>',
      '<script/>',
      '<style/>',
      '<noscript/>',
      '<template/>',
    ])(
      'rejects the self-closing non-void %s before the CSP meta',
      async (markup) => {
        expect(
          await rejectionOf(
            verifyContentSecurityPolicy(beforePolicy(markup), 'fixture'),
          ),
        ).toContain('CSP (fixture)')
      },
    )

    test('accepts self-closing syntax on void elements before the CSP meta', async () => {
      const result = await runVerifier(
        beforePolicy('<meta name="a" content="b" /><link rel="icon" />'),
      )
      expect(result.exitCode).toBe(0)
    })

    // `</html>` also closes head for lol-html, so the meta is no longer in it.
    test('rejects </html> before the CSP meta', async () => {
      expect(
        await rejectionOf(
          verifyContentSecurityPolicy(beforePolicy('</html>'), 'fixture'),
        ),
      ).toContain('CSP (fixture)')
    })

    test.each(['</body>', '</br>', '</div>', '</p>'])(
      'rejects the stray end tag %s before the CSP meta',
      async (markup) => {
        expect(
          await rejectionOf(
            verifyContentSecurityPolicy(beforePolicy(markup), 'fixture'),
          ),
        ).toContain('end tag before the CSP meta')
      },
    )

    // The scan runs on lol-html's output with comments, attributes and raw text
    // bodies removed, so it reads the markup the way a browser tokenizes it.
    describe('end tags hidden from a regex scan', () => {
      const styles = ['a', 'b']
      const withStyles = (markup: string) =>
        validHtml.replace(
          validCsp,
          `${markup}${cspMeta({ scripts: [themeScript], styles })}`,
        )
      const strayEndTag = (html: string) =>
        rejectionOf(verifyContentSecurityPolicy(html, 'fixture'))

      test.each([
        ['an abrupt comment', '<!--></body><!-- -->'],
        ['a comment closed by --!>', '<!-- a --!></body><!-- -->'],
        ['a </style x> end tag', '<style>a</style x></body><style>b</style>'],
        ['a </style/> end tag', '<style>a</style/></body><style>b</style>'],
        [
          '<template> in an attribute value',
          '<meta name="x" content="<template>"></body>',
        ],
        [
          '<!-- in an attribute value',
          '<meta name="x" content="<!--"></body><meta name="y" content="-->">',
        ],
        ['an extra </template>', '</template></body>'],
      ])('rejects </body> after %s', async (_name, markup) => {
        expect(await strayEndTag(withStyles(markup))).toContain(
          '</body> end tag before the CSP meta',
        )
      })

      test('accepts </p> and <template> as text in an attribute value', async () => {
        await verifyContentSecurityPolicy(
          withStyles(
            '<meta name="description" content="a </p> b <template> c <!-- d">',
          ),
          'fixture',
        )
      })

      test('accepts end tags inside a nested template, which is inert', async () => {
        await verifyContentSecurityPolicy(
          withStyles('<template><template></template></body></template>'),
          'fixture',
        )
      })
    })

    test('rejects a character reference in the href of a link before the CSP meta', async () => {
      expect(
        await rejectionOf(
          verifyContentSecurityPolicy(
            beforePolicy(
              '<link rel="stylesheet" href="https&#58;//evil.example/x.css">',
            ),
            'fixture',
          ),
        ),
      ).toContain('character references')
    })

    test('does not reject end tags that follow the CSP meta', async () => {
      const result = await runVerifier(
        validHtml.replace(validCsp, `${validCsp}<template><p>x</p></template>`),
      )
      expect(result.exitCode).toBe(0)
    })

    test('rejects stray text before the CSP meta', async () => {
      await reject(beforePolicy('stray'), 'text in head before the CSP meta')
      await reject(beforePolicy('&nbsp;'), 'text in head before the CSP meta')
    })

    test('accepts head elements, whitespace and comments before the CSP meta', async () => {
      const result = await runVerifier(
        beforePolicy(
          '\n <!-- note --><!-- </body> --><link rel="preload" href="/a.css" as="style"><link rel="author" href="https://sgmr.dev/about"><link rel="icon"><script type="application/json">{"a":"</div>"}</script><noscript><link rel="stylesheet" href="/n.css"></noscript><template><div></div></template>\t\n',
        ),
      )
      expect(result.exitCode).toBe(0)
    })

    test('rejects a CSP meta that only exists inside an inert template or noscript', async () => {
      await reject(
        withCsp(`<template>${validCsp}</template>`),
        'exactly one content-security-policy meta, got 0',
      )
      await reject(
        withCsp(`<noscript>${validCsp}</noscript>`),
        'exactly one content-security-policy meta, got 0',
      )
    })
  })

  describe('directive allowlist', () => {
    const withExtra = (...directives: string[]) =>
      withCsp(
        cspMeta({
          scripts: [themeScript],
          directives: [...baseCspDirectives, ...directives],
        }),
      )

    // The config uses none of these, so they are rejected outright instead of
    // being held to the 'self'/hash allowlist.
    test.each([
      "script-src-elem 'self' 'unsafe-inline' *",
      "script-src-elem 'self'",
      "script-src-attr 'unsafe-inline'",
      "script-src-attr 'none'",
      "style-src-elem 'self' 'unsafe-inline'",
      "style-src-attr 'unsafe-inline'",
    ])('rejects the %s directive', async (directive) => {
      await reject(withExtra(directive), `${directive.split(' ')[0]} is not`)
    })

    test.each([
      'connect-src *',
      'frame-src *',
      'worker-src * blob:',
      "connect-src 'self' https://api.example.com",
      "media-src 'self' data:",
      "font-src 'self' data:",
      "frame-src 'unsafe-inline'",
      "worker-src 'self' blob:",
      "manifest-src 'unsafe-eval'",
      "child-src 'self' 'unsafe-hashes'",
      "prefetch-src 'wasm-unsafe-eval'",
      "connect-src 'self' https:",
    ])('rejects %s in any other directive', async (directive) => {
      const [name] = directive.split(' ')
      await reject(
        withCsp(
          cspMeta({
            scripts: [themeScript],
            directives: [
              ...baseCspDirectives.filter(
                (value) => !value.startsWith(`${name} `),
              ),
              directive,
            ],
          }),
        ),
        `${name} may only list`,
      )
    })

    test("accepts extra directives that only list 'self', 'none' and hashes", async () => {
      const result = await runVerifier(
        withExtra(
          "connect-src 'self'",
          "frame-src 'none'",
          `worker-src 'self' ${cspHash('x')}`,
          'upgrade-insecure-requests',
        ),
      )
      expect(result.exitCode).toBe(0)
    })

    test('rejects a repeated directive, which browsers read from the first copy only', async () => {
      await reject(
        withExtra("connect-src 'self'", 'connect-src *'),
        'duplicate directive connect-src',
      )
    })
  })

  describe('script type classification', () => {
    test.each([
      ' text/javascript ',
      'TEXT/JavaScript',
      'text/livescript',
      'text/jscript',
      'application/x-ecmascript',
      'text/javascript1.5',
      'text/x-javascript',
      'text/javascript; charset=utf-8',
      ' MODULE ',
    ])('hashes an inline script of type "%s"', async (type) => {
      await reject(
        withHead(`<script type="${type}">unhashed()</script>`),
        'inline script hash',
      )
    })

    test('treats a padded executable type as running before the CSP meta', async () => {
      await reject(
        validHtml.replace(
          `<script>${themeScript}</script>`,
          `<script>${themeScript}</script><script type=" text/livescript ">first()</script>`,
        ),
        'before the CSP meta',
      )
    })

    test.each(['importmap', 'speculationrules', ' ImportMap '])(
      'requires a hash for an inline %s block',
      async (type) => {
        await reject(
          withHead(`<script type="${type}">{"imports":{}}</script>`),
          'inline script hash',
        )
      },
    )

    test('accepts a hashed inline import map and keeps other data blocks exempt', async () => {
      const importMap = '{"imports":{"a":"/a.js"}}'
      const html = withCsp(
        cspMeta({ scripts: [themeScript, importMap] }),
      ).replace(
        '</head>',
        `<script type="importmap">${importMap}</script><script type="text/plain">data</script></head>`,
      )
      const result = await runVerifier(html)
      expect(result.exitCode).toBe(0)
    })
  })

  describe('same-origin script sources', () => {
    test.each([
      ['a backslash', '/\\evil.com/x.js'],
      ['a tab', '/\t/evil.com/x.js'],
      ['a newline', '/\n/evil.com/x.js'],
      ['a double backslash', '\\\\evil.com/x.js'],
      ['a different port', 'https://sgmr.dev:8443/x.js'],
      ['another scheme', 'http://sgmr.dev/x.js'],
    ])('rejects %s smuggling another origin', async (_label, src) => {
      await reject(
        withHead(`<script src="${src}"></script>`),
        'external script',
      )
    })

    test('accepts root-relative, relative and absolute same-origin sources', async () => {
      const result = await runVerifier(
        withHead(
          '<script src="/a.js"></script><script src="b.js"></script><script src="https://sgmr.dev/c.js"></script>',
        ),
      )
      expect(result.exitCode).toBe(0)
    })
  })

  test('requires the CSP on the 404 page too', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        const html = (
          await readFile(join(fixtureRoot, 'dist', '404.html'), 'utf8')
        ).replace(cspMeta(), '')
        await Promise.all(
          ['dist/404.html', '.vercel/output/static/404.html'].map((file) =>
            writeFile(join(fixtureRoot, file), html),
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('CSP (404): expected exactly one')
  })
})

describe('portfolio output verifier: head preamble', () => {
  const reject = async (html: string, message: string) => {
    const result = await runVerifier(html)
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain(message)
  }

  test.each([
    ['text between the doctype and <html>', '<!doctype html>stray<html'],
    [
      'an element between the doctype and <html>',
      '<!doctype html><div></div><html',
    ],
    ['U+FEFF between the doctype and <html>', '<!doctype html>\uFEFF<html'],
    ['U+FEFF before the doctype', '\uFEFF<!doctype html><html'],
  ])('rejects %s', async (_name, replacement) => {
    await reject(
      validHtml.replace('<!doctype html>\n<html', replacement),
      'only whitespace and comments',
    )
  })

  test.each([
    ['text', '<html lang="es">text'],
    ['an element', '<html lang="es"><div></div>'],
    ['U+FEFF', '<html lang="es">\uFEFF'],
    ['a stray end tag', '<html lang="es"></body>'],
  ])('rejects %s between <html> and <head>', async (_name, replacement) => {
    await reject(
      validHtml.replace('<html lang="es">', replacement),
      'only whitespace and comments',
    )
  })

  describe('markup a regex scan misreads', () => {
    const preambleError = (html: string) =>
      rejectionOf((async () => verifyHeadPreamble(html, 'fixture'))())

    test.each([
      ['an abrupt comment', '<html lang="es"><!-->x<!-- -->'],
      ['a comment closed by --!>', '<html lang="es"><!-- a --!>x<!-- -->'],
      ['a custom element', '<html-x>'],
      ['an end tag', '<html lang="es"></body>'],
    ])('rejects text or markup after %s before <head>', async (_name, tag) => {
      expect(
        await preambleError(validHtml.replace('<html lang="es">', tag)),
      ).toContain('only whitespace and comments')
    })

    test('accepts a > or a <head> inside an <html> attribute value', async () => {
      await verifyHeadPreamble(
        validHtml.replace(
          '<html lang="es">',
          '<html lang="es" data-x="<head>" data-y="a > b">',
        ),
        'fixture',
      )
    })

    test('accepts a charset meta that follows an abrupt comment in head', async () => {
      await verifyHeadPreamble(
        validHtml.replace('<head>', '<head><!-->'),
        'fixture',
      )
    })

    test('rejects a charset meta hidden inside a comment closed by --!>', async () => {
      expect(
        await preambleError(
          validHtml.replace(
            headPreamble,
            `<!-- a --!><meta charset="latin1"> --><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`,
          ),
        ),
      ).toContain('first element in head')
    })
  })

  test('does not take a <head> inside a comment for the real one', async () => {
    await reject(
      validHtml.replace('<html lang="es">', '<html lang="es"><!-- <head> -->x'),
      'only whitespace and comments',
    )
  })

  test('accepts whitespace and comments between the doctype, <html> and <head>', async () => {
    const result = await runVerifier(
      validHtml.replace(
        '<!doctype html>\n<html lang="es">\n  <head>',
        '<!doctype html>\r\n\t<!-- a --> <html lang="es"><!-- b -->\f\n<head>',
      ),
    )
    expect(result.exitCode).toBe(0)
  })

  test('rejects a head whose first element is not the charset meta', async () => {
    await reject(
      validHtml.replace(
        headPreamble,
        `<link rel="preload" href="/f.woff2" as="font" crossorigin>${headPreamble}`,
      ),
      'first element in head must be <meta charset="utf-8">',
    )
  })

  test('rejects a charset meta that ends after the first 1024 bytes', async () => {
    await reject(
      validHtml.replace('<head>', `<head><!-- ${'x'.repeat(1100)} -->`),
      'within the first 1024 bytes',
    )
  })

  test('rejects a missing viewport meta and a duplicated charset meta', async () => {
    await reject(
      validHtml.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '',
      ),
      'exactly one viewport meta',
    )
    await reject(
      validHtml.replace('</head>', '<meta charset="utf-8"></head>'),
      'exactly one charset meta',
    )
  })

  test('applies the same preamble check to the 404 page', async () => {
    const result = await runVerifier(
      validHtml,
      validSitemap,
      async (fixtureRoot) => {
        const html = (
          await readFile(join(fixtureRoot, 'dist', '404.html'), 'utf8')
        ).replace(headPreamble, '')
        await Promise.all(
          ['dist/404.html', '.vercel/output/static/404.html'].map((file) =>
            writeFile(join(fixtureRoot, file), html),
          ),
        )
      },
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toContain('head preamble (404)')
  })
})
