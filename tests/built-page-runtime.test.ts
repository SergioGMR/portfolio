import type { HTMLButtonElement, HTMLSelectElement } from 'happy-dom'
import { afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs'
import { Window } from 'happy-dom'
import {
  collectInlineScriptHashes,
  extractInlineScripts,
  hashCspSource,
} from '../src/lib/csp'
import { createProfileFaq } from '../src/lib/profile-faq'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

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
    url.pathname === '/' ? 'dist/index.html' : `dist${url.pathname}/index.html`
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
        experience?.querySelector('p.text-primary')?.textContent.trim(),
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
      expect(desktopCard?.querySelector('img')?.getAttribute('alt')).toBe(
        locale === 'es'
          ? 'Captura de la interfaz de UploadIMG - Desktop'
          : 'UploadIMG - Desktop interface screenshot',
      )
    })
  }
})

describe('compiled portfolio content and contact choices', () => {
  const normalize = (text: string | undefined | null) =>
    text?.replace(/\s+/g, ' ').trim()
  for (const [path, locale, headline, intro, choices, subjects, footer] of [
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
      expect(
        normalize(document.querySelector('footer')?.textContent),
      ).toContain(footer)
      expect(document.body.textContent).not.toMatch(
        /10\+ Years|Clean Hexagonal|Hexagonal/,
      )
      const specialty = document.querySelector(
        '.code-panel > div:last-child > div:first-child',
      )
      expect(specialty?.querySelector('span.block')?.textContent.trim()).toBe(
        locale === 'es' ? 'ESPECIALIDAD' : 'SPECIALTY',
      )
      expect(specialty?.querySelector('.font-semibold')?.textContent).toBe(
        'Laravel',
      )
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
      const card = homepage.document.querySelector(
        `#proyectos a[href="${path}"]`,
      )
      expect(card?.querySelectorAll('p').length).toBe(2)
      expect(normalize(card?.querySelectorAll('p')[1]?.textContent)).toBe(
        summary,
      )
      expect(normalize(card?.textContent)?.includes(detail)).toBe(false)
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
      const project = PROFESSIONAL_PROFILE.projects.find(
        (candidate) => candidate.id === id,
      )!
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
        expectMode(failure === 'read' ? 'dark' : saved)
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
      expect(spans[1]?.className).toContain('font-semibold')
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
      const cards = Array.from(document.querySelectorAll('.bento-card')).filter(
        (card) =>
          [education[0], languageLabel[0]].some(
            (label) =>
              label === normalize(card.querySelector('h2')?.textContent),
          ),
      )
      expect(cards).toHaveLength(2)
      expect(
        cards.map((card) => [
          normalize(card.querySelector('h2')?.textContent),
          normalize(card.querySelector('h3')?.textContent),
          card.querySelector('h2')?.className,
          card.querySelector('h3')?.className,
        ]),
      ).toEqual([
        [
          education[0],
          education[1],
          'text-muted-foreground text-xs tracking-[0.3em] uppercase',
          'text-foreground mt-2 text-lg font-semibold tracking-tight sm:text-xl',
        ],
        [
          languageLabel[0],
          languageLabel[1],
          'text-muted-foreground text-xs tracking-[0.3em] uppercase',
          'text-foreground mt-2 text-lg font-semibold tracking-tight sm:text-xl',
        ],
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
      expect(normalize(headings[0]!.textContent)).toBe(faqTitle)
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
      expect(section!.querySelector('[aria-hidden="true"]')).toBeNull()
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

    test(`orders the FAQ between the cards and contact on the grid at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const document = browser.document
      const faqRow = document.querySelector(
        '#preguntas-frecuentes',
      )?.parentElement
      const contactRow = document.querySelector('#contacto')?.parentElement
      expect(faqRow?.className).toContain('order-5')
      expect(faqRow?.className).toContain('lg:col-span-12')
      expect(faqRow?.className).toContain('lg:row-start-3')
      expect(contactRow?.className).toContain('order-6')
      expect(contactRow?.className).toContain('lg:col-span-12')
      expect(contactRow?.className).toContain('lg:row-start-4')
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

describe('compiled header logo', () => {
  for (const [path, locale] of [
    ['/', 'es'],
    ['/en', 'en'],
  ] as const) {
    test(`hides the decorative header logo from assistive tech at ${path}`, () => {
      const { browser } = openBuiltPage(path, locale)
      const link = browser.document.querySelector('header a[href^="/"]')
      const logo = link?.querySelector('img')
      expect(logo?.getAttribute('alt')).toBe('')
      expect(link?.textContent).toContain('SergioGMR')
    })
  }
})

describe('compiled content security policy', () => {
  const componentsRoot = new URL('src/components/', root)
  const pages = globSync('**/*.html', { cwd: new URL('dist/', root) })
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
