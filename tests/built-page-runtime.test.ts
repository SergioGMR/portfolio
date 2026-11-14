import type {
  Element as HappyElement,
  HTMLButtonElement,
  HTMLSelectElement,
} from 'happy-dom'
import { afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import {
  collectInlineScriptHashes,
  extractInlineScripts,
  hashCspSource,
} from '../src/lib/csp'
import { createProfileFaq } from '../src/lib/profile-faq'
import { INDEXABLE_PATHS } from '../src/lib/site'
import {
  PROFESSIONAL_PROFILE,
  sortExperiencesByStartDate,
} from '../src/lib/professional-profile'

const root = new URL('../', import.meta.url)
const windows: Window[] = []
const caseStudyIds = PROFESSIONAL_PROFILE.projects.map(({ id }) => id)

beforeAll(async () => {
  // Compile the composed pages: source-level function calls cannot detect an
  // unmounted Astro client component or an omitted bundle entry point.
  const build = Bun.spawn(['bun', 'run', 'build'], {
    cwd: root.pathname,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    build.exited,
    new Response(build.stdout).text(),
    new Response(build.stderr).text(),
  ])
  if (exitCode !== 0)
    throw new Error(`Runtime fixture build failed: ${stdout}${stderr}`)
}, 30_000)

afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.close()))
})

function openBuiltPage(
  path: string,
  preferredLanguage: 'es' | 'en',
  configureBrowser?: (browser: Window) => void,
) {
  const url = new URL(path, 'https://sgmr.dev')
  const browser = new Window({
    url: url.toString(),
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
    },
  })
  windows.push(browser)
  browser.localStorage.setItem('language', preferredLanguage)
  configureBrowser?.(browser)
  const artifact =
    url.pathname === '/'
      ? 'dist/index.html'
      : url.pathname.endsWith('.html')
        ? `dist${url.pathname}`
        : `dist${url.pathname}/index.html`
  browser.document.write(readFileSync(new URL(artifact, root), 'utf8'))
  const title = browser.document.title
  const description = browser.document
    .querySelector('meta[name="description"]')
    ?.getAttribute('content')
  const schema = browser.document.querySelector(
    'script[type="application/ld+json"]',
  )?.textContent
  // Run the actual compiled client modules emitted on this page. This is a
  // DOM simulation, not a claim of native-browser module or visual coverage.
  for (const script of browser.document.querySelectorAll(
    'script[type="module"]',
  )) {
    const source = script.getAttribute('src')
    const code = source
      ? readFileSync(new URL(`dist${source}`, root), 'utf8')
      : script.textContent
    if (!code) throw new Error('Built module has no code')
    // Each module owns a lexical scope; evaluating minified modules as global
    // scripts would wrongly make their short variable names overwrite each other.
    browser.eval(`(() => {\n${code}\n})()`)
  }
  return { browser, title, description, schema }
}

function webpSize(bytes: Buffer) {
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF')
  expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP')
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
  expect(chunk).toBe('VP8 ')
  return {
    width: bytes.readUInt16LE(26) & 0x3fff,
    height: bytes.readUInt16LE(28) & 0x3fff,
  }
}

/** Case studies declare their own built WebP card; every other page keeps og.jpg. */
function expectedSocialCard(path: string) {
  const isCaseStudy = /^\/(?:en\/projects|proyectos)\//.test(path)
  if (!isCaseStudy)
    return {
      url: 'https://sgmr.dev/og.jpg',
      type: 'image/jpeg',
      width: 1200,
      height: 630,
    }
  const html = readFileSync(new URL(`dist${path}/index.html`, root), 'utf8')
  const url =
    /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1] ?? ''
  expect(url).toMatch(/^https:\/\/sgmr\.dev\/_astro\/[^"/]+\.webp$/)
  const file = new URL(`dist${new URL(url).pathname}`, root)
  expect(existsSync(file)).toBe(true)
  return { url, type: 'image/webp', ...webpSize(readFileSync(file)) }
}

function languageHref(browser: Window, language: string) {
  return browser.document
    .querySelector(`a[data-language-link][hreflang="${language}"]`)
    ?.getAttribute('href')
}

describe('compiled apex origin', () => {
  test('uses the independently confirmed apex in all 22 page identities and discovery URLs', () => {
    const paths = [
      '/',
      '/en',
      '/acezone/tos',
      '/en/acezone/tos',
      '/wattly/tos',
      '/en/wattly/tos',
      ...caseStudyIds.flatMap((id) => [
        `/proyectos/${id}`,
        `/en/projects/${id}`,
      ]),
    ]
    expect(paths).toHaveLength(22)
    for (const path of paths) {
      const { browser, schema } = openBuiltPage(path, 'es')
      const document = browser.document
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(`https://sgmr.dev${path}`)
      for (const alternate of document.querySelectorAll(
        'link[rel="alternate"][hreflang]',
      )) {
        expect(new URL(alternate.getAttribute('href')!).origin).toBe(
          'https://sgmr.dev',
        )
      }
      for (const [attribute, key] of [
        ['property', 'og:url'],
        ['name', 'twitter:url'],
      ] as const) {
        expect(
          document
            .querySelector(`meta[${attribute}="${key}"]`)
            ?.getAttribute('content'),
        ).toBe(`https://sgmr.dev${path}`)
      }
      const card = expectedSocialCard(path)
      for (const [attribute, key] of [
        ['property', 'og:image'],
        ['property', 'og:image:secure_url'],
        ['name', 'twitter:image'],
      ] as const) {
        expect(
          document
            .querySelector(`meta[${attribute}="${key}"]`)
            ?.getAttribute('content'),
        ).toBe(card.url)
      }
      expect(schema).not.toContain('https://www.sgmr.dev')
      const identity = JSON.parse(schema ?? '{}')
      expect(identity.url).toBe(`https://sgmr.dev${path}`)
      expect(identity.author?.['@id'] ?? identity.mainEntity?.['@id']).toBe(
        'https://sgmr.dev/#person',
      )
    }
    const sitemap = readFileSync(new URL('dist/sitemap.xml', root), 'utf8')
    expect(
      Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
    ).toEqual(paths.map((path) => `https://sgmr.dev${path}`))
    expect(readFileSync(new URL('dist/robots.txt', root), 'utf8')).toContain(
      'Sitemap: https://sgmr.dev/sitemap.xml',
    )
  })
})

describe('compiled head metadata and structured data', () => {
  const pagePaths = [
    '/',
    '/en',
    '/acezone/tos',
    '/en/acezone/tos',
    '/wattly/tos',
    '/en/wattly/tos',
    ...caseStudyIds.flatMap((id) => [`/proyectos/${id}`, `/en/projects/${id}`]),
  ]
  const meta = (
    document: ReturnType<typeof openBuiltPage>['browser']['document'],
    selector: string,
  ) => document.querySelector(`meta[${selector}]`)?.getAttribute('content')

  test('uses name for twitter tags, drops googlebot and declares the alternate locale', () => {
    for (const path of pagePaths) {
      const { browser } = openBuiltPage(path, 'es')
      const document = browser.document
      expect(
        document.querySelectorAll('meta[property^="twitter:"]'),
      ).toHaveLength(0)
      expect(document.querySelectorAll('meta[name="googlebot"]')).toHaveLength(
        0,
      )
      for (const key of [
        'twitter:card',
        'twitter:url',
        'twitter:title',
        'twitter:description',
        'twitter:image',
        'twitter:image:alt',
        'twitter:site',
        'twitter:creator',
      ])
        expect(document.querySelectorAll(`meta[name="${key}"]`)).toHaveLength(1)
      const language = path === '/en' || path.startsWith('/en/') ? 'en' : 'es'
      expect(
        Array.from(
          document.querySelectorAll('meta[property="og:locale:alternate"]'),
          (element) => element.getAttribute('content'),
        ),
      ).toEqual([language === 'es' ? 'en_US' : 'es_ES'])
    }
  })

  test('declares the real social card type and dimensions, with project-specific alt text', () => {
    for (const path of pagePaths) {
      const { browser, schema } = openBuiltPage(path, 'es')
      const document = browser.document
      const card = expectedSocialCard(path)
      expect(meta(document, 'property="og:image:type"')).toBe(card.type)
      expect(meta(document, 'property="og:image:width"')).toBe(
        String(card.width),
      )
      expect(meta(document, 'property="og:image:height"')).toBe(
        String(card.height),
      )
      const alt = meta(document, 'property="og:image:alt"')
      expect(meta(document, 'name="twitter:image:alt"')).toBe(alt)
      if (/proyectos|projects/.test(path)) {
        const title = JSON.parse(schema!).mainEntity.name as string
        expect(alt).toBe(
          path.startsWith('/en/')
            ? `${title} interface screenshot`
            : `Captura de la interfaz de ${title}`,
        )
        expect(card.url).not.toBe('https://sgmr.dev/og.jpg')
        // Every case study declares, and really emits, a 1200x630 card.
        expect(card.width).toBe(1200)
        expect(card.height).toBe(630)
      }
    }
  })

  test('opens every head with the charset meta, then the viewport, within 1024 bytes', () => {
    const files = [
      ...pagePaths.map((path) =>
        path === '/' ? 'dist/index.html' : `dist${path}/index.html`,
      ),
      'dist/404.html',
    ]
    for (const file of files) {
      const html = readFileSync(new URL(file, root), 'utf8')
      const opening =
        /^<!doctype html>\s*<html[^>]*>\s*<head>\s*(<meta charset="utf-8">)\s*(<meta name="viewport" content="width=device-width, initial-scale=1">)/i.exec(
          html,
        )
      expect(opening, file).not.toBeNull()
      expect(opening![0].length, file).toBeLessThan(256)
      expect(
        Buffer.byteLength(html.slice(0, opening![0].length)),
        file,
      ).toBeLessThan(1024)
      expect(html.match(/<meta charset=/gi), file).toHaveLength(1)
      expect(html.match(/<meta name="viewport"/gi), file).toHaveLength(1)
    }
  })

  test('allows images from self only and emits no data: image URIs', () => {
    const files = [
      ...pagePaths.map((path) =>
        path === '/' ? 'dist/index.html' : `dist${path}/index.html`,
      ),
      'dist/404.html',
    ]
    for (const file of files) {
      const html = readFileSync(new URL(file, root), 'utf8')
      expect(html, file).toContain("img-src 'self';")
      expect(html, file).not.toMatch(/img-src[^;"]*data:/)
      expect(html, file).not.toMatch(
        /<(?:img|source|image)\b[^>]*(?:src|srcset|href)=["']\s*data:/i,
      )
      expect(html, file).not.toMatch(/url\(\s*["']?data:/i)
    }
    const astroDir = new URL('dist/_astro/', root)
    for (const name of readdirSync(astroDir).filter((n) => n.endsWith('.css')))
      expect(readFileSync(new URL(name, astroDir), 'utf8'), name).not.toMatch(
        /url\(\s*["']?data:/i,
      )
  })

  test('links the icon set and emits each file in its declared format', () => {
    for (const path of pagePaths) {
      const document = openBuiltPage(path, 'es').browser.document
      const link = (selector: string) =>
        Array.from(document.querySelectorAll(`link[${selector}]`))
      expect(link('rel="icon"').map((element) => element.outerHTML)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('href="/favicon.ico"'),
          expect.stringContaining('href="/favicon-96x96.png"'),
          expect.stringContaining('href="/favicon.avif"'),
        ]),
      )
      const ico = document.querySelector(
        'link[rel="icon"][href="/favicon.ico"]',
      )
      expect(ico?.getAttribute('sizes')).toBe('32x32')
      const png = document.querySelector(
        'link[rel="icon"][href="/favicon-96x96.png"]',
      )
      expect(png?.getAttribute('sizes')).toBe('96x96')
      expect(png?.getAttribute('type')).toBe('image/png')
      const apple = link('rel="apple-touch-icon"')
      expect(apple).toHaveLength(1)
      expect(apple[0]?.getAttribute('href')).toBe('/apple-touch-icon.png')
      expect(apple[0]?.getAttribute('sizes')).toBe('180x180')
    }
    const png = (name: string) => {
      const bytes = readFileSync(new URL(`dist/${name}`, root))
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
    }
    expect(png('favicon-96x96.png')).toEqual([96, 96])
    expect(png('apple-touch-icon.png')).toEqual([180, 180])
    expect(png('sergio-morales-avatar.png')).toEqual([500, 500])
    const ico = readFileSync(new URL('dist/favicon.ico', root))
    expect([ico.readUInt16LE(2), ico.readUInt16LE(4), ico[6], ico[7]]).toEqual([
      1, 1, 32, 32,
    ])
  })

  test('publishes one JSON-LD object per page with the full person and its dates', () => {
    for (const path of pagePaths) {
      const { browser, schema } = openBuiltPage(path, 'es')
      expect(
        browser.document.querySelectorAll('script[type="application/ld+json"]'),
      ).toHaveLength(1)
      const data = JSON.parse(schema!)
      expect(data['@graph']).toBeUndefined()
      expect(data.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const person =
        data.mainEntity?.['@type'] === 'Person' ? data.mainEntity : data.author
      expect(person['@id']).toBe('https://sgmr.dev/#person')
      expect(person.alternateName).toBe('SergioGMR')
      expect(person.image).toBe('https://sgmr.dev/sergio-morales-avatar.png')
      expect(person.knowsAbout).toContain('Laravel')
      expect(person.alumniOf.name).toBe('I.E.S. El Rincón')
      if (path === '/' || path === '/en') {
        expect(data.isPartOf['@id']).toBe('https://sgmr.dev/#website')
        expect(data.isPartOf.publisher).toEqual({ '@id': person['@id'] })
      }
    }
  })
})

describe('compiled Solutec removal and retained Tecandu experience', () => {
  test('omits removed case artifacts from both static outputs and routing', () => {
    for (const directory of ['dist', '.vercel/output/static']) {
      for (const path of ['/proyectos/solutec', '/en/projects/solutec']) {
        expect(
          existsSync(new URL(`${directory}${path}/index.html`, root)),
        ).toBe(false)
      }
    }
    const config = JSON.parse(
      readFileSync(new URL('.vercel/output/config.json', root), 'utf8'),
    )
    expect(JSON.stringify(config.routes)).not.toMatch(/solutec/i)
    expect(config.routes.at(-1)).toMatchObject({
      dest: '/404.html',
      status: 404,
    })
  })

  for (const [path, locale, company, dates, responsibility] of [
    [
      '/',
      'es',
      'Freelance | Tecandu S.L. · España',
      '01/10/2023 — 23/04/2024',
      'Coordinación del equipo de desarrollo y del equipo DevOps',
    ],
    [
      '/en',
      'en',
      'Freelance | Tecandu S.L. · Spain',
      '01/10/2023 — 23/04/2024',
      'Coordination of the development team and the DevOps team',
    ],
  ] as const) {
    test(`renders Tecandu as company text without the removed link at ${path}`, () => {
      const { browser, schema } = openBuiltPage(path, locale)
      const articles = Array.from(
        browser.document.querySelectorAll('#experiencia article'),
      )
      const experience = articles.find((article) =>
        article.textContent.includes('Tecandu S.L.'),
      )
      expect(experience).toBeDefined()
      expect(experience?.querySelectorAll('a').length).toBe(0)
      expect(
        experience
          ?.querySelector('[data-experience-company]')
          ?.textContent.trim(),
      ).toBe(company)
      expect(experience?.textContent).toContain(dates)
      expect(experience?.textContent).toContain(responsibility)
      expect(experience?.textContent).toContain('Laravel Sanctum')
      expect(experience?.textContent).toContain('GitHub Actions')
      expect(experience?.textContent).toContain('Plesk')
      expect(browser.document.body.textContent).not.toMatch(/solutec/i)
      expect(
        Array.from(browser.document.querySelectorAll('a'))
          .map((a) => a.href)
          .join(' '),
      ).not.toMatch(/solutec/i)
      expect(schema).not.toMatch(/solutec/i)
      expect(browser.document.querySelectorAll('#proyectos h3')).toHaveLength(8)
      const desktopPath = `${locale === 'es' ? '/proyectos' : '/en/projects'}/uploadimg-desktop`
      const desktopCard = browser.document.querySelector(
        `#proyectos a[href="${desktopPath}"]`,
      )
      expect(desktopCard).not.toBeNull()
      expect(desktopCard?.querySelector('h3')?.textContent.trim()).toBe(
        'UploadIMG - Desktop',
      )
      // Every project card is an internal link to its case study.
      expect(desktopCard?.getAttribute('target')).toBeNull()
      expect(
        browser.document.querySelectorAll('#proyectos a[target="_blank"]'),
      ).toHaveLength(0)
      // The thumbnail is decorative: the heading in the same link names it.
      expect(desktopCard?.querySelector('img')?.getAttribute('alt')).toBe('')
    })
  }
})

describe('compiled portfolio content and contact choices', () => {
  const normalize = (text: string | undefined | null) =>
    text?.replace(/\s+/g, ' ').trim()
  for (const [
    path,
    locale,
    headline,
    intro,
    choices,
    subjects,
    retiredFooterCopy,
  ] of [
    [
      '/',
      'es',
      'Sergio Morales Rodríguez, Tech Lead Full Stack. Arquitectura y desarrollo web con Laravel.',
      'Soy Sergio Morales Rodríguez, de Las Palmas. Desarrollo aplicaciones web y APIs, con experiencia coordinando equipos de desarrollo y DevOps.',
      ['Proponer un proyecto', 'Hablar de una oportunidad'],
      [
        'Proyecto para Sergio Morales',
        'Oportunidad profesional para Sergio Morales',
      ],
      'Hablemos de tu equipo o de tu próximo proyecto.',
    ],
    [
      '/en',
      'en',
      'Sergio Morales Rodríguez, Full Stack Tech Lead. Web architecture and development with Laravel.',
      'I’m Sergio Morales Rodríguez, based in Las Palmas. I develop web applications and APIs, with experience coordinating development and DevOps teams.',
      ['Propose a project', 'Discuss a career opportunity'],
      ['Project for Sergio Morales', 'Career opportunity for Sergio Morales'],
      'Let’s talk about your team or your next project.',
    ],
  ] as const) {
    test(`identifies the Laravel role and offers equal contact choices at ${path}`, () => {
      const { browser, title, description } = openBuiltPage(path, locale)
      const document = browser.document
      expect(normalize(document.querySelector('#inicio h1')?.textContent)).toBe(
        headline,
      )
      expect(
        normalize(document.querySelector('#inicio')?.textContent),
      ).toContain(intro)
      expect(title).toContain('Sergio Morales Rodríguez')
      expect(title).toContain('Laravel')
      expect(description).toContain('Laravel')
      const links = Array.from(
        document.querySelectorAll('#contacto a[href*="?subject="]'),
      )
      expect(links.map((link) => normalize(link.textContent))).toEqual([
        ...choices,
      ])
      expect(links.map((link) => link.className)).toEqual([
        links[0]?.className,
        links[0]?.className,
      ])
      expect(
        links.map((link, index) => {
          expect(link.getAttribute('href')).toBe(
            `mailto:sergiogmr+portfolio@icloud.com?subject=${encodeURIComponent(subjects[index]!)}`,
          )
          const href = new URL(link.getAttribute('href')!)
          expect(href.protocol).toBe('mailto:')
          expect(href.pathname).toBe('sergiogmr+portfolio@icloud.com')
          expect(href.searchParams.size).toBe(1)
          return href.searchParams.get('subject')
        }),
      ).toEqual([...subjects])
      // The footer is minimal now: the call to action lives in the contact section.
      expect(
        normalize(document.querySelector('footer')?.textContent),
      ).not.toContain(retiredFooterCopy)
      expect(document.body.textContent).not.toMatch(
        /10\+ Years|Clean Hexagonal|Hexagonal/,
      )
      // The three facts of the retired code bento live in the hero facts strip.
      const facts = Array.from(
        document.querySelectorAll('#inicio dl > div'),
      ).map((fact) => [
        normalize(fact.querySelector('dt')?.textContent),
        normalize(fact.querySelector('dd')?.textContent),
      ])
      expect(facts).toEqual(
        locale === 'es'
          ? [
              ['Especialidad', 'Laravel'],
              ['Enfoque', 'APIs & CI/CD'],
              ['Ubicación', 'Las Palmas, España'],
            ]
          : [
              ['Specialty', 'Laravel'],
              ['Focus', 'APIs & CI/CD'],
              ['Location', 'Las Palmas, Spain'],
            ],
      )
      expect(document.querySelector('.code-panel')).toBeNull()
      const cv = document.querySelector(
        `#inicio a[href="/sergio-morales-${locale}.pdf"]`,
      )
      expect(cv?.getAttribute('target')).toBe('_blank')
      expect(cv?.getAttribute('rel')).toBe('noopener noreferrer')
      expect(document.body.textContent).not.toContain('TechLeadProfile')
    })

    test(`links capabilities to named cases and the stable Tecandu anchor at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const home = locale === 'es' ? '/' : '/en'
      const prefix = locale === 'es' ? '/proyectos' : '/en/projects'
      const links = Array.from(
        browser.document.querySelectorAll('#habilidades a'),
      )
      expect(
        links.map((link) => [
          normalize(link.textContent),
          link.getAttribute('href'),
        ]),
      ).toEqual([
        ['Todo-Lux', `${prefix}/todo-lux`],
        ['Tecandu', `${home}#experiencia-tecandu`],
        ['Basuraleza', `${prefix}/basuraleza`],
        ['Todo-Lux', `${prefix}/todo-lux`],
        ['Basuraleza', `${prefix}/basuraleza`],
        ['Todo-Lux', `${prefix}/todo-lux`],
        ['Tecandu', `${home}#experiencia-tecandu`],
        ['Tecandu', `${home}#experiencia-tecandu`],
      ])
      expect(
        browser.document.querySelectorAll('#experiencia-tecandu').length,
      ).toBe(1)
      browser.location.hash = '#experiencia-tecandu'
      browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
      expect(languageHref(browser, 'es')).toBe('/#experiencia-tecandu')
      expect(languageHref(browser, 'en')).toBe('/en#experiencia-tecandu')
    })
  }

  for (const [id, locale, summary, detail, outcome] of [
    [
      'jauntjar',
      'es',
      'Aplicación privada de viajes con Laravel, creada junto a mi mujer, ingeniera de datos, para planificar destinos y valorar experiencias.',
      'Modelado de la información y gestión de destinos',
      'Registro de lugares visitados, planificación de destinos futuros y valoraciones, con mapas y estadísticas de nuestros viajes.',
    ],
    [
      'jauntjar',
      'en',
      'A private Laravel travel app, built with my wife, a data engineer, to plan destinations and rate experiences.',
      'Information modeling and destination management',
      'Visited-place records, future destination planning, and ratings, with maps and statistics for our travels.',
    ],
    [
      'todo-lux',
      'es',
      'Desarrollo con Laravel de BackOffice, importación BMCAT y backups, desde el análisis de requisitos hasta el frontend y los flujos de eventos y colas.',
      'Diseño del sistema de importación de archivos BMCAT',
      'BackOffice y sistema de backups implementados; importación BMCAT, frontend y lógica de eventos y colas desarrollados.',
    ],
    [
      'todo-lux',
      'en',
      'Laravel development of BackOffice, BMCAT import, and backups, from requirements analysis to the frontend and event and queue flows.',
      'Design of the BMCAT file import system',
      'BackOffice and backup system implemented; BMCAT import, frontend, and event and queue logic developed.',
    ],
    [
      'basuraleza',
      'es',
      'Desarrollo del backend y de las aplicaciones web y móvil para caracterizar residuos, con Laravel, Livewire y Quasar Framework.',
      'Desarrollo de la aplicación móvil con Quasar Framework',
      'Backend desarrollado con Laravel y aplicaciones web y móvil desarrolladas para la caracterización de residuos.',
    ],
    [
      'basuraleza',
      'en',
      'Development of backend, web, and mobile applications for waste characterization with Laravel, Livewire, and Quasar Framework.',
      'Mobile application development with Quasar Framework',
      'Laravel backend and web and mobile applications developed for waste characterization.',
    ],
    ...PROFESSIONAL_PROFILE.projects
      .slice(3)
      .flatMap((project) =>
        (['es', 'en'] as const).map(
          (locale) =>
            [
              project.id,
              locale,
              project.summary[locale],
              project.tasks[locale][0]!,
              project.result[locale],
            ] as const,
        ),
      ),
  ] as const) {
    test(`adds documented detail beyond the ${id} card in ${locale}`, () => {
      const home = locale === 'es' ? '/' : '/en'
      const path = `${locale === 'es' ? '/proyectos' : '/en/projects'}/${id}`
      const { browser: homepage } = openBuiltPage(home, locale)
      const row = homepage.document.querySelector(
        `#proyectos a[href="${path}"]`,
      )
      // A row is the summary and a plain-text line of at most four technologies.
      expect(row?.querySelectorAll('p').length).toBe(2)
      expect(normalize(row?.querySelectorAll('p')[0]?.textContent)).toBe(
        summary,
      )
      const project = PROFESSIONAL_PROFILE.projects.find(
        (candidate) => candidate.id === id,
      )!
      expect(normalize(row?.querySelectorAll('p')[1]?.textContent)).toBe(
        project.technologies.slice(0, 4).join(' · '),
      )
      expect(normalize(row?.textContent)?.includes(detail)).toBe(false)
      const {
        browser: casePage,
        title,
        description,
      } = openBuiltPage(path, locale)
      const article = casePage.document.querySelector('main article')
      expect(normalize(article?.textContent)).toContain(detail)
      expect(normalize(article?.textContent)).toContain(outcome)
      expect(article?.querySelectorAll('section ul li').length).toBeGreaterThan(
        3,
      )
      expect(title).toContain(project.titleFocus[locale])
      expect(description).toContain(summary)
      expect(description).toContain(
        casePage.document.querySelector('h1')?.textContent ?? 'missing title',
      )
      expect(
        article?.querySelector('a[target="_blank"]')?.getAttribute('href'),
      ).toBe(project.evidenceUrl)
      for (const technology of project.technologies)
        expect(normalize(article?.textContent)).toContain(technology)
    })
  }
})

describe('compiled page language enhancement', () => {
  for (const [path, locale, opposite] of [
    ['/#proyectos', 'es', 'en'],
    ['/en#proyectos', 'en', 'es'],
  ] as const) {
    test(`keeps the section when switching language from ${path}`, () => {
      const { browser, title, description, schema } = openBuiltPage(
        path,
        opposite,
      )
      expect(languageHref(browser, 'es')).toBe('/#proyectos')
      expect(languageHref(browser, 'en')).toBe('/en#proyectos')
      browser.location.hash = '#contacto'
      browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
      expect(languageHref(browser, 'es')).toBe('/#contacto')
      expect(languageHref(browser, 'en')).toBe('/en#contacto')
      expect(browser.document.documentElement.lang).toBe(locale)
      expect(browser.document.title).toBe(title)
      expect(
        browser.document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
      ).toBe(description)
      expect(
        browser.document.querySelector('script[type="application/ld+json"]')
          ?.textContent,
      ).toBe(schema)
      expect(browser.localStorage.getItem('language')).toBe(opposite)
    })
  }
  const equivalentPages = [
    ['/acezone/tos', '/en/acezone/tos'],
    ['/wattly/tos', '/en/wattly/tos'],
    ...caseStudyIds.map((id) => [`/proyectos/${id}`, `/en/projects/${id}`]),
  ]
  for (const [spanish, english] of equivalentPages) {
    for (const [path, locale, opposite] of [
      [spanish!, 'es', 'en'],
      [english!, 'en', 'es'],
    ] as const) {
      test(`keeps the shared main-content fragment and equivalent page from ${path}`, () => {
        const { browser, title, description, schema } = openBuiltPage(
          `${path}#main-content`,
          opposite,
        )
        expect(browser.document.getElementById('main-content')).not.toBeNull()
        expect(languageHref(browser, 'es')).toBe(`${spanish}#main-content`)
        expect(languageHref(browser, 'en')).toBe(`${english}#main-content`)
        browser.location.hash = ''
        browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
        expect(languageHref(browser, 'es')).toBe(spanish)
        expect(languageHref(browser, 'en')).toBe(english)
        browser.location.hash = '#main-content'
        browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
        expect(languageHref(browser, 'es')).toBe(`${spanish}#main-content`)
        expect(languageHref(browser, 'en')).toBe(`${english}#main-content`)
        expect(browser.document.documentElement.lang).toBe(locale)
        expect(browser.document.title).toBe(title)
        expect(
          browser.document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content'),
        ).toBe(description)
        expect(
          browser.document.querySelector('script[type="application/ld+json"]')
            ?.textContent,
        ).toBe(schema)
        expect(browser.localStorage.getItem('language')).toBe(opposite)
      })
    }
  }
})

describe('compiled visible case-study breadcrumbs', () => {
  for (const [path, label, home] of [
    ['/proyectos/jauntjar', 'Proyectos', '/#proyectos'],
    ['/en/projects/jauntjar', 'Projects', '/en#proyectos'],
  ] as const) {
    test(`matches the visible breadcrumb with structured data at ${path}`, () => {
      const { browser } = openBuiltPage(path, 'es')
      const navigation = browser.document.querySelector(
        'nav[aria-label="Breadcrumb"], nav[aria-label="Ruta de navegación"]',
      )
      expect(navigation?.querySelector('a')?.getAttribute('href')).toBe(home)
      expect(navigation?.querySelector('a')?.textContent.trim()).toBe(label)
      expect(
        navigation?.querySelector('[aria-current="page"]')?.textContent,
      ).toBe('JauntJar')
      const schema = JSON.parse(
        browser.document.querySelector('script[type="application/ld+json"]')
          ?.textContent ?? '{}',
      )
      expect(schema.breadcrumb.itemListElement).toEqual([
        {
          '@type': 'ListItem',
          position: 1,
          name: label,
          item: `https://sgmr.dev${home}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'JauntJar',
          item: `https://sgmr.dev${path}`,
        },
      ])
    })
  }
})

describe('compiled localized theme controls', () => {
  for (const failure of ['read', 'write'] as const) {
    for (const saved of ['light', 'dark', 'system'] as const) {
      test(`keeps theme controls and system changes working with blocked ${failure} and saved ${saved}`, () => {
        let systemDark = false
        let changeSystem = (_dark: boolean) => undefined
        const { browser } = openBuiltPage('/', 'es', (browser) => {
          browser.localStorage.setItem('theme', saved)
          const storage = browser.localStorage
          Object.defineProperty(
            storage,
            `${failure === 'read' ? 'get' : 'set'}Item`,
            {
              value: () => {
                throw new Error('Storage blocked')
              },
            },
          )
          const query = browser.matchMedia('(prefers-color-scheme: dark)')
          Object.defineProperty(query, 'matches', { get: () => systemDark })
          browser.matchMedia = () => query
          changeSystem = (dark) => {
            systemDark = dark
            query.dispatchEvent(new browser.Event('change'))
          }
        })
        const document = browser.document
        const select = document.querySelector<HTMLSelectElement>(
          '[data-theme-select]',
        )
        if (!select) throw new Error('Missing mobile theme selector')
        const expectMode = (mode: string) => {
          expect(select.value).toBe(mode)
          for (const button of document.querySelectorAll(
            '[data-theme-option]',
          )) {
            const active = button.getAttribute('data-theme-option') === mode
            expect(button.getAttribute('aria-pressed')).toBe(String(active))
            expect(button.getAttribute('data-active')).toBe(String(active))
          }
          const dark = mode === 'dark' || (mode === 'system' && systemDark)
          expect(document.documentElement.classList.contains('dark')).toBe(dark)
          expect(document.documentElement.style.colorScheme).toBe(
            dark ? 'dark' : 'light',
          )
        }
        expectMode(failure === 'read' ? 'system' : saved)
        document
          .querySelector<HTMLButtonElement>('[data-theme-option="system"]')
          ?.click()
        expectMode('system')
        changeSystem(true)
        expectMode('system')
        changeSystem(false)
        expectMode('system')
        select.value = 'light'
        select.dispatchEvent(new browser.Event('change', { bubbles: true }))
        changeSystem(true)
        expectMode('light')
        document
          .querySelector<HTMLButtonElement>('[data-theme-option="dark"]')
          ?.click()
        changeSystem(false)
        expectMode('dark')
        if (failure === 'write')
          expect(browser.localStorage.getItem('theme')).toBe(saved)
      })
    }
  }

  for (const [path, labels, accessible] of [
    ['/', ['Claro', 'Oscuro', 'Sistema'], 'Seleccionar tema'],
    ['/en', ['Light', 'Dark', 'System'], 'Select theme'],
  ] as const) {
    test(`uses localized accessible labels and preserves theme changes at ${path}`, () => {
      const { browser } = openBuiltPage(path, path === '/' ? 'en' : 'es')
      const document = browser.document
      const select = document.querySelector<HTMLSelectElement>(
        '[data-theme-select]',
      )
      expect(select?.getAttribute('aria-label')).toBe(accessible)
      expect(
        Array.from(select?.options ?? []).map((option) => option.textContent),
      ).toEqual([...labels])
      for (const [index, mode] of ['light', 'dark', 'system'].entries()) {
        const button = document.querySelector<HTMLButtonElement>(
          `[data-theme-option="${mode}"]`,
        )
        expect(button?.textContent.trim()).toBe(labels[index])
        expect(button?.getAttribute('aria-label')).toBe(
          path === '/'
            ? `Cambiar tema a ${labels[index]}`
            : `Switch theme to ${labels[index]}`,
        )
        button?.click()
        expect(browser.localStorage.getItem('theme')).toBe(mode)
        expect(select?.value).toBe(mode)
        expect(button?.getAttribute('aria-pressed')).toBe('true')
        const systemDark = browser.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches
        expect(document.documentElement.classList.contains('dark')).toBe(
          mode === 'dark' || (mode === 'system' && systemDark),
        )
      }
      if (!select) throw new Error('Missing mobile theme selector')
      select.value = 'light'
      select.dispatchEvent(new browser.Event('change', { bubbles: true }))
      expect(browser.localStorage.getItem('theme')).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  }
})

describe('compiled legal content styles', () => {
  for (const path of [
    '/acezone/tos',
    '/en/acezone/tos',
    '/wattly/tos',
    '/en/wattly/tos',
  ]) {
    test(`uses the active theme colors throughout the legal content at ${path}`, () => {
      const { browser } = openBuiltPage(path, 'es')
      const document = browser.document
      for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
        const href = link.getAttribute('href')
        if (!href) throw new Error('Stylesheet has no href')
        const css = readFileSync(new URL(`dist${href}`, root), 'utf8')
        const style = document.createElement('style')
        // Happy DOM does not evaluate Tailwind's @layer base. Expose the
        // emitted theme rules unchanged so the computed colors use real tokens.
        style.textContent = `${css}\n${[
          ...(css.match(/:root\{[^}]+\}/g) ?? []),
          ...(css.match(/\.dark\{[^}]+\}/g) ?? []),
        ].join('\n')}`
        document.head.append(style)
      }
      for (const dark of [false, true]) {
        document.documentElement.classList.toggle('dark', dark)
        const rootStyle = browser.getComputedStyle(document.documentElement)
        for (const [selector, token] of [
          ['h1', '--foreground'],
          ['h2', '--foreground'],
          ['.subtitle', '--primary'],
          ['.date', '--muted-foreground'],
          ['p:not(.subtitle):not(.date)', '--muted-foreground'],
          ['li', '--muted-foreground'],
          ['.contact-link', '--primary'],
        ]) {
          const element = document.querySelector(`.prose-tos ${selector}`)
          if (!element) throw new Error(`Missing legal content: ${selector}`)
          const colorToken = rootStyle.getPropertyValue(token!).trim()
          expect(colorToken).not.toBe('')
          const reference = document.createElement('span')
          reference.style.color = `hsl(${colorToken})`
          document.body.append(reference)
          expect(reference.style.color).not.toBe('')
          expect(browser.getComputedStyle(element).color).toBe(
            browser.getComputedStyle(reference).color,
          )
          reference.remove()
        }
      }
    })
  }
})

describe('compiled institution name', () => {
  test('spells «I.E.S. El Rincón» correctly in every emitted page', () => {
    const pages = globSync('**/*.html', { cwd: new URL('dist/', root) })
    expect(pages.length).toBeGreaterThanOrEqual(23)

    let withInstitution = 0
    for (const page of pages) {
      const html = readFileSync(new URL(`dist/${page}`, root), 'utf8')
      expect(html).not.toContain('El Ricón')
      if (html.includes('I.E.S. El Rincón')) withInstitution += 1
    }
    expect(withInstitution).toBeGreaterThanOrEqual(2)
  })
})

describe('compiled home headings and FAQ', () => {
  const normalize = (text: string | undefined | null) =>
    text?.replace(/\s+/g, ' ').trim()
  const headingLevels = (document: Window['document']) =>
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
      (heading) => Number(heading.tagName.slice(1)),
    )

  for (const [path, locale, faqTitle, questions, education, languageLabel] of [
    [
      '/',
      'es',
      'Preguntas frecuentes',
      [
        '¿Quién es Sergio Morales Rodríguez?',
        '¿Con qué tecnologías trabaja?',
        '¿Qué proyectos ha desarrollado?',
        '¿Qué idiomas habla?',
        '¿Está disponible para nuevos proyectos?',
        '¿Cómo contactar con Sergio?',
      ],
      [
        'Formación',
        'Certificado de Educación Superior en Desarrollo de Aplicaciones Web',
      ],
      ['Idiomas', 'Inglés'],
    ],
    [
      '/en',
      'en',
      'Frequently asked questions',
      [
        'Who is Sergio Morales Rodríguez?',
        'Which technologies does he work with?',
        'What projects has he built?',
        'Which languages does he speak?',
        'Is he available for new work?',
        'How can I contact Sergio?',
      ],
      [
        'Education',
        'Certificate of Higher Education in Web Application Development',
      ],
      ['Languages', 'English'],
    ],
  ] as const) {
    test(`puts the name in the only H1 and keeps the headline visual spans at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const document = browser.document
      const h1s = document.querySelectorAll('h1')
      expect(h1s).toHaveLength(1)
      const h1 = h1s[0]!
      expect(normalize(h1.textContent)).toStartWith(
        'Sergio Morales Rodríguez, ',
      )
      expect(h1.className).toContain('text-foreground')
      const spans = Array.from(h1.children)
      expect(spans.map((span) => span.tagName)).toEqual(['SPAN', 'SPAN'])
      expect(spans[0]?.className).toContain('block')
      expect(spans[0]?.className).toContain('text-primary')
      expect(spans[0]?.querySelector(':scope > .sr-only')?.textContent).toBe(
        ', ',
      )
      expect(spans[1]?.className).toContain('block')
      expect(spans[1]?.className).toContain('font-display')
      // Optical size is pinned so the headline width does not depend on the
      // font size and the metric-matched fallback stays valid at every width.
      expect(spans[1]?.className).toContain(
        "[font-variation-settings:'opsz'_96]",
      )
      // The separator is only for assistive technology and must not add spaces.
      expect(h1.textContent).toContain('Rodríguez, ')
      expect(h1.textContent).not.toMatch(/Rodríguez\s+,/)
      expect(
        document.querySelector('#inicio > div > p.text-primary'),
      ).toBeNull()
    })

    test(`labels Education and Languages with h2 and their values with h3 at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const document = browser.document
      const section = document.querySelector('main > section:not([id])')!
      const blocks = Array.from(
        section.querySelectorAll('[data-compact-block]'),
      )
      expect(
        blocks.map((block) => [
          normalize(block.querySelector('h2')?.textContent),
          normalize(block.querySelector('h3')?.textContent),
        ]),
      ).toEqual([
        [education[0], education[1]],
        [languageLabel[0], languageLabel[1]],
      ])
      // Mono uppercase labels like the rest of the index, no cards.
      for (const block of blocks) {
        expect(block.querySelector('h2')?.className).toContain('font-mono')
        expect(block.querySelector('h2')?.className).toContain('uppercase')
        expect(block.querySelector('h3')?.className).toContain('font-display')
      }
      expect(section.querySelector('.bento-card')).toBeNull()
      // The five CEFR levels are a definition list, not boxed tiles.
      const language = PROFESSIONAL_PROFILE.languages[0]!
      expect(
        Array.from(section.querySelectorAll('dl dd')).map((dd) =>
          normalize(dd.textContent),
        ),
      ).toEqual([
        language.levels.listening,
        language.levels.reading,
        language.levels.writing,
        language.levels.spokenProduction,
        language.levels.spokenInteraction,
      ])
    })

    test(`renders a visible single-language FAQ before contact at ${path}`, () => {
      const { browser, schema } = openBuiltPage(path, locale)
      const document = browser.document
      const section = document.querySelector('section#preguntas-frecuentes')
      expect(section).not.toBeNull()
      expect(document.querySelectorAll('#preguntas-frecuentes')).toHaveLength(1)
      expect(
        section!.compareDocumentPosition(document.querySelector('#contacto')!) &
          4,
      ).toBeTruthy()

      const headings = Array.from(section!.querySelectorAll('h2, h3'))
      expect(headings.map((heading) => heading.tagName)).toEqual([
        'H2',
        'H3',
        'H3',
        'H3',
        'H3',
        'H3',
        'H3',
      ])
      // The decorative number precedes the title inside the h2.
      expect(
        normalize(
          headings[0]!.querySelector('[data-lang-content]')?.textContent,
        ),
      ).toBe(faqTitle)
      expect(headings.slice(1).map((h) => normalize(h.textContent))).toEqual([
        ...questions,
      ])

      const faq = createProfileFaq(locale)
      const items = Array.from(section!.querySelectorAll('h3')).map((heading) =>
        heading.closest('[data-faq-item]'),
      )
      expect(items).toHaveLength(6)
      for (const [index, item] of items.entries()) {
        expect(item).not.toBeNull()
        const answer = item!.querySelector('p')
        expect(normalize(answer?.textContent)).toBe(faq[index]!.answer)
        const links = Array.from(item!.querySelectorAll('a'))
        expect(
          links.map((link) => [
            normalize(link.textContent),
            link.getAttribute('href'),
          ]),
        ).toEqual(faq[index]!.links.map((link) => [link.label, link.href]))
        for (const [linkIndex, link] of links.entries()) {
          if (faq[index]!.links[linkIndex]!.external) {
            expect(link.getAttribute('target')).toBe('_blank')
            expect(link.getAttribute('rel')).toBe('noopener noreferrer')
          } else {
            expect(link.getAttribute('target')).toBeNull()
          }
        }
      }

      // Answers are always visible text: no disclosure widget, no hidden node.
      expect(section!.querySelector('details, summary, [hidden]')).toBeNull()
      // Exactly one aria-hidden node: the decorative number inside the h2.
      const hidden = Array.from(section!.querySelectorAll('[aria-hidden]'))
      expect(hidden).toHaveLength(1)
      expect(hidden[0]?.getAttribute('aria-hidden')).toBe('true')
      expect(hidden[0]?.matches('h2 > [data-section-number]')).toBe(true)
      expect(normalize(hidden[0]?.textContent)).toBe('04')
      expect(
        Array.from(section!.querySelectorAll('[data-lang-content]')).every(
          (node) => node.getAttribute('data-lang-content') === locale,
        ),
      ).toBe(true)
      const otherQuestion =
        locale === 'es' ? 'Who is Sergio Morales' : '¿Quién es Sergio Morales'
      expect(section!.textContent).not.toContain(otherQuestion)
      expect(section!.textContent).not.toContain(
        locale === 'es' ? 'Frequently asked' : 'Preguntas frecuentes',
      )

      // A FAQ section must not add FAQPage markup: one JSON-LD script only.
      expect(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).toHaveLength(1)
      expect(schema).not.toContain('FAQPage')
      expect(document.documentElement.innerHTML).not.toContain('FAQPage')
    })

    test(`stacks the home sections in one column in nav order at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const document = browser.document
      const sections = Array.from(document.querySelector('main')!.children)
      // Hero, Projects, Experience, Education/Languages (no id), Stack, FAQ,
      // Contact: DOM order is nav order, with no wrapper grid or reordering.
      expect(sections.map((section) => section.tagName)).toEqual(
        Array(7).fill('SECTION'),
      )
      expect(sections.map((section) => section.id)).toEqual([
        'inicio',
        'proyectos',
        'experiencia',
        '',
        'habilidades',
        'preguntas-frecuentes',
        'contacto',
      ])
      expect(normalize(sections[3]?.querySelector('h2')?.textContent)).toBe(
        locale === 'es' ? 'Formación' : 'Education',
      )
      for (const section of sections)
        expect(section.className).not.toMatch(
          /(^|\s)(lg:)?(order|col-span|col-start|row-start)-\d/,
        )
      const navIds = Array.from(
        document.querySelectorAll('[data-section-link]'),
      ).map((link) => link.getAttribute('href')?.split('#')[1])
      expect(navIds).toEqual(
        sections
          .map((section) => section.id)
          .filter((id) => id && id !== 'inicio'),
      )
    })

    test(`lists eight numbered project rows with at most four technologies at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const rows = Array.from(
        browser.document.querySelectorAll('#proyectos ol > li'),
      )
      expect(rows).toHaveLength(8)
      const prefix = locale === 'es' ? '/proyectos' : '/en/projects'
      for (const [index, row] of rows.entries()) {
        const project = PROFESSIONAL_PROFILE.projects[index]!
        const link = row.querySelector('a')!
        expect(link.getAttribute('href')).toBe(`${prefix}/${project.id}`)
        expect(
          normalize(link.querySelector('[data-row-number]')?.textContent),
        ).toBe(String(index + 1).padStart(2, '0'))
        expect(normalize(link.querySelector('h3')?.textContent)).toBe(
          project.title[locale],
        )
        const technologies = (
          normalize(link.querySelectorAll('p')[1]?.textContent) ?? ''
        ).split(' · ')
        expect(technologies.length).toBeGreaterThan(0)
        expect(technologies.length).toBeLessThanOrEqual(4)
        expect(technologies).toEqual(
          project.technologies.slice(0, technologies.length),
        )
        expect(link.querySelector('.tech-tag')).toBeNull()
        expect(link.getAttribute('class')).toContain('min-h-11')
        // Number and arrow are decorative; the separator never starts a line.
        expect(
          link.querySelector('[data-row-number]')?.getAttribute('aria-hidden'),
        ).toBe('true')
        expect(
          link.querySelector('[data-row-arrow]')?.getAttribute('aria-hidden'),
        ).toBe('true')
        expect(link.querySelector('[data-row-arrow]')?.textContent.trim()).toBe(
          '→',
        )
        expect(link.querySelector('img')?.getAttribute('alt')).toBe('')
        const techLine = link.querySelectorAll('p')[1]!.textContent
        expect(techLine).toBe(project.technologies.slice(0, 4).join('\u00a0· '))
      }
      const heading = browser.document.querySelector('#proyectos h2')
      expect(
        normalize(heading?.querySelector('[data-section-number]')?.textContent),
      ).toBe('01')
      expect(
        normalize(heading?.querySelector('[data-lang-content]')?.textContent),
      ).toBe(locale === 'es' ? 'Proyectos' : 'Projects')
    })

    test(`does not skip heading levels at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const levels = headingLevels(browser.document)
      expect(levels[0]).toBe(1)
      for (const [index, level] of levels.entries()) {
        if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1]! + 1)
      }
    })
  }
})

describe('compiled lower home sections', () => {
  const normalize = (text: string | undefined | null) =>
    text?.replace(/\s+/g, ' ').trim()
  const numberOf = (section: ReturnType<Window['document']['querySelector']>) =>
    normalize(section?.querySelector('h2 [data-section-number]')?.textContent)
  const titleOf = (section: ReturnType<Window['document']['querySelector']>) =>
    normalize(section?.querySelector('h2 [data-lang-content]')?.textContent)

  for (const [path, locale, titles, contactLinks] of [
    [
      '/',
      'es',
      { experience: 'Experiencia', stack: 'Stack', contact: 'Contacto' },
      ['Proponer un proyecto', 'Hablar de una oportunidad'],
    ],
    [
      '/en',
      'en',
      { experience: 'Experience', stack: 'Stack', contact: 'Contact' },
      ['Propose a project', 'Discuss a career opportunity'],
    ],
  ] as const) {
    test(`numbers the section headers like the nav at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const document = browser.document
      const numbered = [
        ['#experiencia', '02', titles.experience],
        ['#habilidades', '03', titles.stack],
        [
          '#preguntas-frecuentes',
          '04',
          locale === 'es'
            ? 'Preguntas frecuentes'
            : 'Frequently asked questions',
        ],
        ['#contacto', '05', titles.contact],
      ] as const
      for (const [selector, number, title] of numbered) {
        const section = document.querySelector(`section${selector}`)
        expect(numberOf(section), selector).toBe(number)
        expect(titleOf(section), selector).toBe(title)
        expect(
          section
            ?.querySelector('h2 [data-section-number]')
            ?.getAttribute('aria-hidden'),
        ).toBe('true')
        expect(section?.querySelector('h2')?.className).toContain(
          'font-display',
        )
      }
      // Education and Languages are not nav sections: no number.
      expect(
        document.querySelector(
          'main > section:not([id]) [data-section-number]',
        ),
      ).toBeNull()
      // The numbers match the nav links.
      expect(
        Array.from(document.querySelectorAll('[data-section-link]'))
          .slice(1)
          .map((link) => link.querySelector('[aria-hidden]')?.textContent),
      ).toEqual(['02', '03', '04', '05'])
    })

    test(`lists experience as ledger rows with the Tecandu anchor at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const section = browser.document.querySelector('section#experiencia')!
      const experiences = sortExperiencesByStartDate(
        PROFESSIONAL_PROFILE.experiences,
      )
      const rows = Array.from(
        section.querySelectorAll('ol > li > article[data-experience-row]'),
      )
      expect(rows.map((row) => row.id)).toEqual(
        experiences.map((experience) => `experiencia-${experience.id}`),
      )
      expect(section.querySelectorAll('#experiencia-tecandu')).toHaveLength(1)
      for (const [index, row] of rows.entries()) {
        const experience = experiences[index]!
        expect(row.className).not.toMatch(/rounded|bento-card|surface-panel/)
        expect(
          normalize(row.querySelector('[data-experience-period]')?.textContent),
        ).toMatch(
          /^\d{2}\/\d{2}\/\d{4} — (\d{2}\/\d{2}\/\d{4}|Actualidad|Current)/,
        )
        expect(normalize(row.querySelector('h3')?.textContent)).toBe(
          experience.title[locale],
        )
        expect(row.querySelector('h3')?.className).toContain('font-display')
        expect(
          normalize(
            row.querySelector('[data-experience-company]')?.textContent,
          ),
        ).toStartWith(
          `${experience.company[locale]} · ${experience.location[locale]}`,
        )
        const links = Array.from(row.querySelectorAll('a'))
        expect(links).toHaveLength(experience.evidenceUrl ? 1 : 0)
        for (const link of links) {
          expect(link.getAttribute('href')).toBe(experience.evidenceUrl ?? null)
          expect(link.getAttribute('target')).toBe('_blank')
          expect(link.getAttribute('rel')).toBe('noopener noreferrer')
          expect(link.className).toContain('min-h-11')
        }
        expect(
          Array.from(row.querySelectorAll('ul > li')).map((item) =>
            normalize(item.textContent),
          ),
        ).toEqual(experience.responsibilities[locale].slice(0, 3))
        expect(
          normalize(
            row.querySelector('[data-experience-outcome]')?.textContent,
          ),
        ).toContain(experience.outcomes[locale][0]!)
        // Technologies are plain mono text, never pills.
        expect(
          normalize(row.querySelector('[data-experience-tech]')?.textContent),
        ).toBe(experience.technologies.join(' · '))
        expect(row.querySelector('.tech-tag')).toBeNull()
      }
      const linkedin = section.querySelector(
        `a[href="${PROFESSIONAL_PROFILE.links.linkedin}"]`,
      )
      expect(linkedin?.className).toContain('min-h-11')
    })

    test(`shows four capability columns with 44px evidence links at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const section = browser.document.querySelector('section#habilidades')!
      const columns = Array.from(section.querySelectorAll('article'))
      const capabilities = PROFESSIONAL_PROFILE.capabilities
      expect(columns).toHaveLength(4)
      expect(columns[0]?.closest('ol')?.className).toContain('lg:grid-cols-4')
      expect(section.querySelector('.tech-tag, .bento-card')).toBeNull()
      for (const [index, column] of columns.entries()) {
        const capability = capabilities[index]!
        expect(normalize(column.querySelector('h3')?.textContent)).toBe(
          capability.label[locale],
        )
        expect(
          normalize(
            column.querySelector('[data-capability-tech]')?.textContent,
          ),
        ).toBe(capability.technologies.join(' · '))
        expect(
          normalize(
            column.querySelector('p:not([data-capability-tech])')?.textContent,
          ),
        ).toBe(capability.summary[locale])
        const links = Array.from(column.querySelectorAll('ul a'))
        expect(links).toHaveLength(capability.evidenceIds.length)
        for (const link of links) {
          expect(link.className).toContain('min-h-11')
          expect(link.className).toContain('inline-flex')
        }
      }
    })

    test(`renders six FAQ rows before contact with 44px links at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const section = browser.document.querySelector(
        'section#preguntas-frecuentes',
      )!
      const items = Array.from(section.querySelectorAll('[data-faq-item]'))
      expect(items).toHaveLength(6)
      expect(items.every((item) => item.tagName === 'LI')).toBe(true)
      expect(items[0]?.parentElement?.tagName).toBe('UL')
      for (const item of items) {
        expect(item.className).toContain('border-t')
        expect(item.className).not.toMatch(/rounded|bento-card/)
        expect(item.querySelector('h3')?.className).toContain('font-display')
        for (const link of item.querySelectorAll('a'))
          expect(link.className).toContain('min-h-11')
      }
      expect(
        section.compareDocumentPosition(
          browser.document.querySelector('#contacto')!,
        ) & 4,
      ).toBeTruthy()
    })

    test(`leads contact with a large email link and the equal choices at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const section = browser.document.querySelector('section#contacto')!
      const email = section.querySelector(
        `a[href="${PROFESSIONAL_PROFILE.links.mail}"]`,
      )
      expect(normalize(email?.textContent)).toBe('sergiogmr@icloud.com')
      expect(email?.getAttribute('data-contact-email')).not.toBeNull()
      expect(email?.className).toContain('font-display')
      expect(email?.className).toContain('min-h-11')
      expect(email?.className).toMatch(/text-\[clamp\(/)
      const choices = Array.from(
        section.querySelectorAll('a[href*="?subject="]'),
      )
      expect(choices.map((link) => normalize(link.textContent))).toEqual([
        ...contactLinks,
      ])
      expect(choices[0]?.className).toBe(choices[1]?.className)
      for (const [name, href] of [
        ['LinkedIn', PROFESSIONAL_PROFILE.links.linkedin],
        ['GitHub', PROFESSIONAL_PROFILE.links.github],
      ] as const) {
        const link = section.querySelector(`a[href="${href}"]`)
        expect(link, name).not.toBeNull()
        expect(link?.getAttribute('target')).toBe('_blank')
        expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
      }
      const cv = PROFESSIONAL_PROFILE.cvUrls[locale]
      expect(browser.document.querySelector(`a[href="${cv}"]`)).not.toBeNull()
      for (const link of section.querySelectorAll('a'))
        expect(link.className, link.getAttribute('href') ?? '').toMatch(
          /min-h-1[123]/,
        )
      expect(section.querySelector('.bento-card, .surface-panel')).toBeNull()
      // The decorative arrows stay out of the accessible names: the choice
      // arrow is CSS content with an empty alternative text, the profile arrow
      // is aria-hidden.
      for (const choice of choices)
        expect(choice.className.split(/\s+/)).toContain(
          "after:content-['→'_/_'']",
        )
      for (const [name, href] of [
        ['LinkedIn', PROFESSIONAL_PROFILE.links.linkedin],
        ['GitHub', PROFESSIONAL_PROFILE.links.github],
      ] as const) {
        const link = section.querySelector(`a[href="${href}"]`)!
        const arrows = Array.from(link.querySelectorAll('[aria-hidden="true"]'))
        expect(arrows.map((arrow) => arrow.textContent.trim())).toEqual(['↗'])
        const clone = link.cloneNode(true) as typeof link
        for (const arrow of clone.querySelectorAll('[aria-hidden="true"]'))
          arrow.remove()
        // The label and handle are separate flex items, so no space text node.
        expect(clone.textContent.replace(/\s+/g, ''), name).toBe(
          `${name}@sergiogmr`,
        )
      }
    })

    test(`drops the hero desktop top padding at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const hero = browser.document.querySelector('#inicio')!
      expect(hero.className).not.toContain('lg:pt-16')
      // main already pads 40px under the header: the hero adds none from lg up.
      expect(hero.className.split(/\s+/)).toContain('lg:pt-0')
    })
  }
})

describe('compiled stylesheet scope and tokens', () => {
  const stylesheet = () =>
    readdirSync(new URL('dist/_astro/', root))
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(new URL(`dist/_astro/${name}`, root), 'utf8'))
      .join('\n')

  test('emits classes from src/ but not from test files', () => {
    const css = stylesheet()
    expect(css).toContain('.min-h-11')
    // This arbitrary value appears only in tests/: Tailwind must not scan it.
    const probe = 'hue-rotate-[37.25deg]'
    expect(
      readFileSync(new URL(import.meta.path, import.meta.url), 'utf8'),
    ).toContain(probe)
    expect(css).not.toContain('37.25deg')
  })

  test('removes the unused card utilities and zeroes every radius token', () => {
    const css = stylesheet()
    for (const removed of [
      '.bento-card',
      '.code-panel',
      '.hero-glow',
      '.status-dot',
      '.result-card',
    ])
      expect(css).not.toContain(removed)
    // Tailwind only emits the theme tokens a utility uses. With no rounded-*
    // class left in src/, none is emitted; any that is must still be zero.
    expect(css).not.toMatch(/\.rounded/)
    const radii = [...css.matchAll(/--radius-([a-z0-9]+):\s*([^;}]+)/g)]
    for (const [, size, value] of radii)
      expect(value!.trim(), `--radius-${size}`).toMatch(/^0(?:px|rem)?$/)
  })

  test('compiles the contact arrow as CSS content with empty alternative text', () => {
    expect(stylesheet()).toMatch(/content:\s*"→"\s*\/\s*""/)
  })

  test('compiles the mobile nav mask into the stylesheet without inline styles', () => {
    const css = stylesheet()
    const gradient =
      /linear-gradient\((?:to right|90deg),#000 calc\(100% - 3rem\),(?:#0000|transparent)\)/
        .source
    expect(css).toMatch(new RegExp(`[{;]mask-image:${gradient}`))
    expect(css).toMatch(new RegExp(`-webkit-mask-image:${gradient}`))
    expect(css).toMatch(
      /\.lg\\:\\\[mask-image\\:none\\\]\{[^}]*mask-image:none/,
    )
    for (const file of ['dist/index.html', 'dist/en/index.html'])
      expect(readFileSync(new URL(file, root), 'utf8')).not.toMatch(
        /<style|\sstyle=/,
      )
  })
})

describe('compiled header identity', () => {
  for (const [path, locale] of [
    ['/', 'es'],
    ['/en', 'en'],
  ] as const) {
    test(`links the home anchor with the name and role as text, without a logo image at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const link = browser.document.querySelector('header a[href^="/"]')
      expect(link?.querySelector('img')).toBeNull()
      expect(link?.textContent).toContain('SergioGMR')
      expect(link?.textContent).toContain('Tech Lead')
      expect(link?.getAttribute('href')).toBe(
        locale === 'es' ? '/#inicio' : '/en#inicio',
      )
    })

    test(`shows the identity strip with name, role, location and availability at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const strip = browser.document.querySelector('[data-identity-strip]')
      const text = strip?.textContent.replace(/\s+/g, ' ') ?? ''
      expect(text).toContain(PROFESSIONAL_PROFILE.person.name)
      expect(text).toContain(PROFESSIONAL_PROFILE.person.location[locale])
      expect(text).toContain('UTC+0/+1')
      expect(text).toContain(
        locale === 'es' ? 'Disponible para colaborar' : 'Open to collaborate',
      )
      expect(strip?.closest('header')).toBeNull()
    })

    test(`keeps a minimal footer with the mail and profile links and no call to action at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const footer = browser.document.querySelector('footer')
      const hrefs = Array.from(footer?.querySelectorAll('a') ?? []).map(
        (link) => link.getAttribute('href'),
      )
      // The verifier requires the plain mail link on every page, legal ones included.
      expect(hrefs).toEqual([
        'mailto:sergiogmr+portfolio@icloud.com',
        'https://x.com/sergiogmr',
        'https://www.linkedin.com/in/sergiogmr',
        'https://github.com/sergiogmr',
        'https://github.com/sergiogmr/portfolio',
      ])
      expect(footer?.querySelector('[data-animate]')).toBeNull()
      for (const link of footer?.querySelectorAll('a') ?? []) {
        expect(link.className).toContain('min-h-11')
        // WCAG 2.5.3: the accessible name contains the visible label.
        const visible = link.textContent.replace(/\s+/g, ' ').trim()
        expect(visible).not.toBe('')
        expect(link.getAttribute('aria-label')).toContain(visible)
      }
    })
  }
})

describe('compiled section navigation', () => {
  const pagesByLocale = [
    ['/', 'es', 'Navegación principal', '/'],
    ['/en', 'en', 'Primary navigation', '/en'],
  ] as const
  const sections = [
    'proyectos',
    'experiencia',
    'habilidades',
    'preguntas-frecuentes',
    'contacto',
  ]
  const labels = {
    es: ['Proyectos', 'Experiencia', 'Stack', 'FAQ', 'Contacto'],
    en: ['Projects', 'Experience', 'Stack', 'FAQ', 'Contact'],
  }

  for (const [path, locale, label, home] of pagesByLocale) {
    test(`lists the numbered sections in page order, FAQ included, at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const nav = browser.document.querySelector(
        `header nav[aria-label="${label}"]`,
      )
      expect(nav).not.toBeNull()
      const links = Array.from(nav!.querySelectorAll('a'))
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        sections.map((id) => `${home}#${id}`),
      )
      expect(
        links.map(
          (link) => link.querySelector('[aria-hidden="true"]')?.textContent,
        ),
      ).toEqual(labels[locale].map((_, index) => `0${index + 1}`))
      expect(
        links.map((link) =>
          link
            .querySelector('[data-lang-content]')
            ?.textContent.replace(/\s+/g, ' ')
            .trim(),
        ),
      ).toEqual([...labels[locale]])
      // The nav order is the order of the sections in the compiled DOM.
      expect(
        Array.from(browser.document.querySelectorAll('main section[id]'))
          .map((section) => section.id)
          .filter((id) => sections.includes(id)),
      ).toEqual(sections)
    })

    test(`keeps the section nav visible and scrollable on mobile at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const header = browser.document.querySelector('header')!
      expect(header.className).toContain('sticky')
      expect(header.className).toContain('top-0')
      const nav = header.querySelector(`nav[aria-label="${label}"]`)!
      expect(nav.closest('.hidden') === null).toBe(true)
      expect(nav.className).toContain('overflow-x-auto')
      for (const link of nav.querySelectorAll('a')) {
        expect(link.className).toContain('min-h-11')
        expect(link.className).toContain('whitespace-nowrap')
        // The nav scrolls (overflow-x-auto), which would clip the global +3px
        // focus ring, so the ring is drawn inside the link.
        expect(link.className).toContain('focus-visible:-outline-offset-2')
        expect(link.className).toContain('focus-visible:outline-2')
        expect(link.className).toContain('focus-visible:outline-ring')
      }
    })

    test(`spaces, pads and fades the mobile section nav only below lg at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const nav = browser.document.querySelector(
        `header nav[aria-label="${label}"]`,
      )!
      const classes = nav.className.split(/\s+/)
      for (const expected of [
        'gap-5',
        'lg:gap-6',
        'pr-12',
        'lg:pr-0',
        'has-[a:focus-visible]:[mask-image:none]',
        '[mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)]',
        'lg:[mask-image:none]',
      ])
        expect(classes, expected).toContain(expected)
      expect(classes).not.toContain('gap-6')
      expect(nav.getAttribute('style')).toBeNull()
    })

    test(`marks the section in view with aria-current from the observer at ${path}`, () => {
      const observers: {
        callback: (entries: unknown[]) => void
        observed: { id: string }[]
      }[] = []
      const { browser } = openBuiltPage(path, locale, (browser) => {
        ;(browser as unknown as Record<string, unknown>).IntersectionObserver =
          class {
            observed: { id: string }[] = []
            constructor(callback: (entries: unknown[]) => void) {
              observers.push({ callback, observed: this.observed })
            }
            observe(element: { id: string }) {
              this.observed.push(element)
            }
            unobserve() {}
            disconnect() {}
          } as never
      })
      const document = browser.document
      // happy-dom does not run inline classic scripts from document.write.
      const script = Array.from(document.querySelectorAll('script')).find(
        (candidate) => candidate.textContent.includes('trackSection'),
      )
      expect(script, 'the shell script is inlined').toBeDefined()
      browser.eval(script!.textContent)
      const current = () =>
        Array.from(
          document.querySelectorAll('[data-section-link][aria-current]'),
        ).map((link) => link.getAttribute('href')?.split('#')[1])
      const spy = observers.find(({ observed }) =>
        observed.some((element) => element.id === 'proyectos'),
      )
      expect(spy, 'a section observer is registered').toBeDefined()
      expect(current()).toEqual([])
      const report = (id: string, isIntersecting: boolean) =>
        spy!.callback([{ target: document.getElementById(id), isIntersecting }])
      report('experiencia', true)
      expect(current()).toEqual(['experiencia'])
      report('habilidades', true)
      expect(current()).toEqual(['experiencia'])
      report('experiencia', false)
      expect(current()).toEqual(['habilidades'])
      report('preguntas-frecuentes', true)
      report('habilidades', false)
      expect(current()).toEqual(['preguntas-frecuentes'])
      report('inicio', true)
      expect(current()).toEqual([])
    })
  }

  test('lists the same sections on a case-study page without marking any as current', () => {
    const { browser } = openBuiltPage('/proyectos/jauntjar', 'es')
    const links = Array.from(
      browser.document.querySelectorAll('header nav[aria-label] a'),
    ).filter((link) => link.getAttribute('href')?.startsWith('/#'))
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      sections.map((id) => `/#${id}`),
    )
    expect(
      browser.document.querySelector('[data-section-link][aria-current]'),
    ).toBeNull()
  })
})

describe('compiled font loading', () => {
  const homes = ['dist/index.html', 'dist/en/index.html']
  const stylesheet = () =>
    readdirSync(new URL('dist/_astro/', root))
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(new URL(`dist/_astro/${name}`, root), 'utf8'))
      .join('\n')

  for (const file of homes) {
    test(`preloads exactly the two Latin variable fonts after the viewport at ${file}`, () => {
      const html = readFileSync(new URL(file, root), 'utf8')
      const preloads = [...html.matchAll(/<link rel="preload"[^>]*>/g)].map(
        ([tag]) => tag,
      )
      expect(preloads).toHaveLength(2)
      expect(preloads.join('')).toMatch(
        /\/_astro\/bricolage-grotesque-latin-opsz-normal\.[\w-]+\.woff2/,
      )
      expect(preloads.join('')).toMatch(
        /\/_astro\/instrument-sans-latin-wght-normal\.[\w-]+\.woff2/,
      )
      for (const tag of preloads) {
        expect(tag).toContain('as="font"')
        expect(tag).toContain('type="font/woff2"')
        expect(tag).toContain('crossorigin')
      }
      expect(html.indexOf('name="viewport"')).toBeGreaterThan(-1)
      expect(html.indexOf(preloads[0]!)).toBeGreaterThan(
        html.indexOf('name="viewport"'),
      )
      expect(html).not.toContain('space-grotesk')
    })
  }

  test('emits the self-hosted faces and both metric-matched fallbacks', () => {
    const css = stylesheet()
    expect(css).not.toMatch(/space-grotesk|Space Grotesk/i)
    expect(css).toMatch(/font-family:\s*["']?Bricolage Grotesque Variable["']?/)
    expect(css).toMatch(/font-family:\s*["']?Instrument Sans Variable["']?/)
    for (const family of ['Bricolage Grotesque', 'Instrument Sans']) {
      const fallback = new RegExp(
        `@font-face\\s*\\{[^}]*${family} Fallback[^}]*\\}`,
      ).exec(css)?.[0]
      expect(fallback, family).toBeDefined()
      for (const descriptor of [
        'size-adjust',
        'ascent-override',
        'descent-override',
        'line-gap-override',
      ])
        expect(fallback, `${family} ${descriptor}`).toContain(`${descriptor}:`)
    }
    for (const font of readdirSync(new URL('dist/_astro/', root)).filter(
      (name) => name.endsWith('.woff2'),
    ))
      expect(font).toMatch(/^(?:bricolage-grotesque|instrument-sans)-latin-/)
  })
})

describe('compiled default theme', () => {
  for (const [path, locale] of [
    ['/', 'es'],
    ['/en', 'en'],
  ] as const) {
    for (const systemDark of [true, false]) {
      test(`follows the system when nothing is stored (system ${systemDark ? 'dark' : 'light'}) at ${path}`, () => {
        const { browser } = openBuiltPage(path, locale, (browser) => {
          const query = browser.matchMedia('(prefers-color-scheme: dark)')
          Object.defineProperty(query, 'matches', { get: () => systemDark })
          browser.matchMedia = () => query
        })
        const root = browser.document.documentElement
        expect(root.classList.contains('dark')).toBe(systemDark)
        expect(root.style.colorScheme).toBe(systemDark ? 'dark' : 'light')
        expect(
          browser.document.querySelector<HTMLSelectElement>(
            '[data-theme-select]',
          )?.value,
        ).toBe('system')
        expect(
          browser.document
            .querySelector('[data-theme-option="system"]')
            ?.getAttribute('aria-pressed'),
        ).toBe('true')
      })
    }
  }
})

describe('compiled default theme fallbacks', () => {
  const headScript = (document: Window['document']) =>
    Array.from(document.querySelectorAll('script')).find((candidate) =>
      candidate.textContent.includes('storedTheme'),
    )!.textContent

  for (const [path, locale] of [
    ['/', 'es'],
    ['/en', 'en'],
  ] as const) {
    test(`treats an invalid stored theme as system at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale, (browser) => {
        browser.localStorage.setItem('theme', 'blue')
        const query = browser.matchMedia('(prefers-color-scheme: dark)')
        Object.defineProperty(query, 'matches', { get: () => true })
        browser.matchMedia = () => query
      })
      const document = browser.document
      expect(
        document.querySelector<HTMLSelectElement>('[data-theme-select]')?.value,
      ).toBe('system')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      // The head script resolves the same way before the toggle module runs.
      document.documentElement.classList.remove('dark')
      browser.eval(headScript(document))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    test(`paints the system theme from the head script when storage reads fail at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale, (browser) => {
        Object.defineProperty(browser.localStorage, 'getItem', {
          value: () => {
            throw new Error('Storage blocked')
          },
        })
        const query = browser.matchMedia('(prefers-color-scheme: dark)')
        Object.defineProperty(query, 'matches', { get: () => true })
        browser.matchMedia = () => query
      })
      const document = browser.document
      // Only the head script runs before first paint, so it must not leave the
      // light theme behind when a dark system cannot be overridden by storage.
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = ''
      browser.eval(headScript(document))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })
  }
})

describe('compiled content security policy', () => {
  const componentsRoot = new URL('src/components/', root)
  // Derived from the route list, not from dist/: test collection runs before
  // beforeAll builds the site, so a dist/ glob here is empty on a clean CI.
  const pages = [
    ...INDEXABLE_PATHS.map((path) =>
      path === '/' ? 'index.html' : `${path.slice(1)}/index.html`,
    ),
    '404.html',
  ]
  const policyOf = (html: string) => {
    const metas = [
      ...html.matchAll(
        /<meta http-equiv="content-security-policy" content="([^"]*)"/g,
      ),
    ]
    expect(metas).toHaveLength(1)
    return Object.fromEntries(
      metas[0]![1]!
        .split(';')
        .map((part) => part.trim().split(/\s+/))
        .filter(([name]) => name)
        .map(([name, ...sources]) => [name, sources]),
    ) as Record<string, string[]>
  }

  test('covers all 23 emitted pages, the 404 included', () => {
    expect(pages).toHaveLength(23)
    expect(pages).toContain('404.html')
    expect(
      globSync('**/*.html', { cwd: new URL('dist/', root) }).sort(),
    ).toEqual([...pages].sort())
  })

  for (const page of pages) {
    test(`emits a strict hashed policy at ${page}`, () => {
      const html = readFileSync(new URL(`dist/${page}`, root), 'utf8')
      const policy = policyOf(html)
      expect(policy['script-src']).toContain("'self'")
      expect(policy['style-src']).toContain("'self'")
      expect(policy['script-src']).not.toContain("'unsafe-inline'")
      expect(policy['script-src']).not.toContain("'unsafe-eval'")
      expect(policy['style-src']).not.toContain("'unsafe-inline'")
      expect(policy['object-src']).toEqual(["'none'"])
      expect(policy['base-uri']).toEqual(["'self'"])
      expect(policy['form-action']).toEqual(["'self'"])
      expect(policy['frame-ancestors']).toBeUndefined()
      expect(html).not.toMatch(/\s(?:on[a-z]+|style)=/i)
      expect(html).not.toMatch(/<script[^>]+src="(?:https?:)?\/\/(?!sgmr\.dev)/)
    })

    test(`lists only 'self', 'none' and hashes in every directive at ${page}`, () => {
      const policy = policyOf(
        readFileSync(new URL(`dist/${page}`, root), 'utf8'),
      )
      for (const [name, sources] of Object.entries(policy)) {
        // `*-elem` and `*-attr` would override script-src/style-src.
        expect(name).not.toMatch(/^(?:script|style)-src-(?:elem|attr)$/)
        for (const source of sources)
          expect(source).toMatch(
            /^(?:'self'|'none'|'sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}')$/,
          )
      }
    })

    test(`keeps the policy meta inside the parsed head at ${page}`, () => {
      const html = readFileSync(new URL(`dist/${page}`, root), 'utf8')
      const browser = new Window({
        url: new URL(
          page === 'index.html' ? '/' : `/${page}`,
          'https://sgmr.dev',
        ).toString(),
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
        },
      })
      windows.push(browser)
      browser.document.write(html)
      // happy-dom does not close head implicitly at a stray element, so this
      // confirms the meta is present and parsed as a head child; the verifier
      // (`verifyContentSecurityPolicy`) rejects the markup that would move it.
      expect(
        browser.document.querySelectorAll(
          'meta[http-equiv="content-security-policy" i]',
        ),
      ).toHaveLength(1)
      expect(
        browser.document.querySelector(
          'head > meta[http-equiv="content-security-policy" i]',
        ),
      ).not.toBeNull()
    })

    test(`allows every inline script that ${page} emits by hash`, () => {
      const html = readFileSync(new URL(`dist/${page}`, root), 'utf8')
      const scripts = policyOf(html)['script-src']!
      const inline = [
        ...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g),
      ].filter(([, attributes]) => !/ld\+json/.test(attributes!))
      expect(inline.length).toBeGreaterThanOrEqual(1)
      for (const [, , body] of inline)
        expect(scripts).toContain(`'${hashCspSource(body!)}'`)
    })
  }

  test('emits each is:inline script byte for byte, so its source hash stays valid', () => {
    const sources = globSync('**/*.astro', { cwd: componentsRoot }).flatMap(
      (file) =>
        extractInlineScripts(
          readFileSync(new URL(file, componentsRoot), 'utf8'),
        ),
    )
    expect(sources.length).toBeGreaterThanOrEqual(2)
    const hashes = collectInlineScriptHashes(componentsRoot)
    const home = readFileSync(new URL('dist/index.html', root), 'utf8')
    const scripts = policyOf(home)['script-src']!
    for (const body of sources) {
      expect(home).toContain(`<script>${body}</script>`)
      expect(hashes).toContain(hashCspSource(body))
      expect(scripts).toContain(`'${hashCspSource(body)}'`)
    }
  })
})

describe('compiled case-study, legal and 404 pages', () => {
  const projects = PROFESSIONAL_PROFILE.projects
  const normalize = (text: string | undefined | null) =>
    text?.replace(/\s+/g, ' ').trim() ?? ''
  /** Text a screen reader announces: decorative (aria-hidden) nodes removed. */
  const accessibleText = (element: HappyElement) => {
    const copy = element.cloneNode(true) as HappyElement
    for (const hidden of copy.querySelectorAll('[aria-hidden="true"]'))
      hidden.remove()
    return normalize(copy.textContent)
  }
  const projectPath = (id: string, locale: 'es' | 'en') =>
    locale === 'es' ? `/proyectos/${id}` : `/en/projects/${id}`
  const artifact = (path: string) =>
    readFileSync(
      new URL(
        path === '/404' ? 'dist/404.html' : `dist${path}/index.html`,
        root,
      ),
      'utf8',
    )

  for (const locale of ['es', 'en'] as const) {
    const labels =
      locale === 'es'
        ? {
            group: 'Más proyectos',
            prev: 'Proyecto anterior',
            next: 'Siguiente proyecto',
            evidence: 'Ver proyecto',
            all: 'Ver todos los proyectos',
          }
        : {
            group: 'More projects',
            prev: 'Previous project',
            next: 'Next project',
            evidence: 'View project',
            all: 'View all projects',
          }

    for (const [index, project] of projects.entries()) {
      const path = projectPath(project.id, locale)

      test(`links the neighbouring projects, omitting the missing end, at ${path}`, () => {
        const { browser } = openBuiltPage(path, locale)
        const navigation = browser.document.querySelector(
          `article nav[data-case-nav][aria-label="${labels.group}"]`,
        )
        expect(navigation).not.toBeNull()
        const links = Array.from(navigation!.querySelectorAll('a'))
        const expected = [
          [projects[index - 1], 'prev', labels.prev],
          [projects[index + 1], 'next', labels.next],
        ] as const
        const present = expected.filter(([neighbour]) => neighbour)
        expect(links).toHaveLength(present.length)
        expect(present.length).toBeGreaterThan(0)
        for (const [neighbour, direction, label] of present) {
          const link = navigation!.querySelector(
            `a[data-case-nav-link="${direction}"]`,
          )!
          expect(link.getAttribute('href')).toBe(
            projectPath(neighbour!.id, locale),
          )
          expect(accessibleText(link)).toBe(
            `${label}: ${neighbour!.title[locale]}`,
          )
          expect(link.className).toContain('min-h-11')
          // The colon is part of the label's own text node. A separate sr-only
          // span makes Chrome compute "Label : Title" (absolutely positioned
          // content gets a space around it).
          expect(link.querySelector('.sr-only')).toBeNull()
          const own = Array.from(link.querySelector('span')!.childNodes)
            .filter((node) => node.nodeType === 3)
            .map((node) => normalize(node.textContent))
          expect(own).toEqual([`${label}:`])
        }
        // The first project has no previous link and the last has no next.
        expect(
          navigation!.querySelector('a[data-case-nav-link="prev"]') !== null,
        ).toBe(index !== 0)
        expect(
          navigation!.querySelector('a[data-case-nav-link="next"]') !== null,
        ).toBe(index !== projects.length - 1)
      })

      test(`keeps the case contracts and caps the prose at ${path}`, () => {
        const { browser } = openBuiltPage(path, locale)
        const document = browser.document
        const articles = document.querySelectorAll('main article')
        expect(articles).toHaveLength(1)
        const article = articles[0]!
        // One H1, then only H2: no skipped level.
        expect(document.querySelectorAll('h1')).toHaveLength(1)
        expect(normalize(document.querySelector('h1')?.textContent)).toBe(
          project.title[locale],
        )
        expect(
          Array.from(document.querySelectorAll('main h1, main h2, main h3'))
            .map((heading) => heading.tagName)
            .filter((tag, position) => (position === 0 ? true : tag !== 'H2')),
        ).toEqual(['H1'])
        // Prose is capped near 70 characters per line.
        const prose = Array.from(article.querySelectorAll('[data-case-prose]'))
        expect(prose).toHaveLength(5)
        for (const element of prose)
          expect(element.className).toContain('max-w-[48ch]')
        const text = normalize(article.textContent)
        for (const field of [
          project.problem,
          project.responsibility,
          project.solution,
          project.result,
        ])
          expect(text).toContain(field[locale])
        for (const task of project.tasks[locale]) expect(text).toContain(task)
        for (const technology of project.technologies)
          expect(text).toContain(technology)
        // The evidence link keeps its target and its decorative arrow.
        const evidence = article.querySelector(
          `a[href="${project.evidenceUrl}"]`,
        )!
        expect(evidence.getAttribute('target')).toBe('_blank')
        expect(evidence.getAttribute('rel')).toBe('noopener noreferrer')
        expect(accessibleText(evidence)).toBe(labels.evidence)
        expect(
          normalize(
            article.querySelector(`[data-case-actions] a[href$="#proyectos"]`)
              ?.textContent,
          ),
        ).toBe(labels.all)
        // Every control in the article is at least 44px tall.
        for (const link of article.querySelectorAll('a'))
          expect(link.className, link.getAttribute('href') ?? '').toMatch(
            /\bmin-h-(?:11|12|13)\b/,
          )
      })
    }
  }

  const caseArtifacts = projects.flatMap(({ id }) => [
    `/proyectos/${id}`,
    `/en/projects/${id}`,
  ])
  for (const path of [
    ...caseArtifacts,
    '/acezone/tos',
    '/en/acezone/tos',
    '/wattly/tos',
    '/en/wattly/tos',
    '/404',
  ]) {
    test(`ships no panels, frames, pills or unhashed styles at ${path}`, () => {
      const html = artifact(path)
      const classes = [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(
        ([, value]) => value!.split(/\s+/),
      )
      for (const old of ['surface-panel', 'media-frame', 'tech-tag'])
        expect(classes, `${old} at ${path}`).not.toContain(old)
      expect(
        classes.filter((name) => /^(?:sm:|lg:|dark:)?rounded/.test(name)),
        `rounded at ${path}`,
      ).toEqual([])
      expect(html).not.toMatch(/\sstyle=/)
      // Astro inlines the small legal stylesheet; its hash must be in style-src.
      const policy = /style-src ([^;"]*)/.exec(html)?.[1] ?? ''
      for (const [, content] of html.matchAll(
        /<style[^>]*>([\s\S]*?)<\/style>/g,
      ))
        expect(policy, `style hash at ${path}`).toContain(
          hashCspSource(content!),
        )
    })
  }

  test('keeps the 404 content and gives its link a 44px target', () => {
    const { browser } = openBuiltPage('/404.html', 'en')
    expect(normalize(browser.document.querySelector('h1')?.textContent)).toBe(
      'Page not found',
    )
    const link = browser.document.querySelector('main a[href="/"]')!
    expect(normalize(link.textContent)).toBe('Go back home')
    expect(link.className).toMatch(/\bmin-h-(?:11|12|13)\b/)
    expect(browser.document.querySelectorAll('h1')).toHaveLength(1)
  })

  test('uses the display face for the legal headings and keeps one H1', () => {
    for (const path of ['/acezone/tos', '/en/wattly/tos']) {
      const html = artifact(path)
      expect(html).toMatch(
        /\.prose-tos h1\{[^}]*font-family:var\(--font-display\)/,
      )
      expect(html).toMatch(
        /\.prose-tos h2\{[^}]*font-family:var\(--font-display\)/,
      )
      const { browser } = openBuiltPage(path, 'es')
      expect(browser.document.querySelectorAll('h1')).toHaveLength(1)
    }
  })

  for (const [path, locale] of [
    ['/', 'es'],
    ['/en', 'en'],
  ] as const) {
    test(`excludes the decorative arrows from the experience link names at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const section = browser.document.querySelector('section#experiencia')!
      const linkedin = section.querySelector(
        `a[href="${PROFESSIONAL_PROFILE.links.linkedin}"]`,
      )!
      expect(normalize(linkedin.textContent)).toBe('LinkedIn ↗')
      expect(accessibleText(linkedin)).toBe('LinkedIn')
      const company = Array.from(
        section.querySelectorAll('[data-experience-company] a'),
      )
      expect(company.length).toBeGreaterThan(0)
      for (const link of company) {
        expect(normalize(link.textContent)).toEndWith(' ↗')
        expect(accessibleText(link)).not.toContain('↗')
        expect(accessibleText(link)).toMatch(/ · /)
      }
      for (const arrow of section.querySelectorAll('a [aria-hidden="true"]'))
        expect(arrow.textContent).toBe('↗')
    })
  }
})
