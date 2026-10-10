import type { HTMLButtonElement, HTMLSelectElement } from 'happy-dom'
import { afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { Window } from 'happy-dom'

const root = new URL('../', import.meta.url)
const windows: Window[] = []

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

function openBuiltPage(path: string, preferredLanguage: 'es' | 'en') {
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

function languageHref(browser: Window, language: string) {
  return browser.document
    .querySelector(`a[data-language-link][hreflang="${language}"]`)
    ?.getAttribute('href')
}

describe('compiled apex origin', () => {
  test('uses the independently confirmed apex in all 12 page identities and discovery URLs', () => {
    const paths = [
      '/',
      '/en',
      '/acezone/tos',
      '/en/acezone/tos',
      '/wattly/tos',
      '/en/wattly/tos',
      ...['jauntjar', 'todo-lux', 'basuraleza'].flatMap((id) => [
        `/proyectos/${id}`,
        `/en/projects/${id}`,
      ]),
    ]
    expect(paths).toHaveLength(12)
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
      for (const property of ['og:url', 'twitter:url']) {
        expect(
          document
            .querySelector(`meta[property="${property}"]`)
            ?.getAttribute('content'),
        ).toBe(`https://sgmr.dev${path}`)
      }
      for (const property of [
        'og:image',
        'og:image:secure_url',
        'twitter:image',
      ]) {
        expect(
          document
            .querySelector(`meta[property="${property}"]`)
            ?.getAttribute('content'),
        ).toBe('https://sgmr.dev/og.jpg')
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
      expect(browser.document.querySelectorAll('#proyectos h3')).toHaveLength(7)
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
      'Tech Lead Full Stack. Arquitectura y desarrollo web con Laravel.',
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
      'Full Stack Tech Lead. Web architecture and development with Laravel.',
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
      expect(title).toContain('Laravel')
      expect(description).toContain(summary)
      expect(description).toContain(
        casePage.document.querySelector('h1')?.textContent ?? 'missing title',
      )
      if (id === 'basuraleza')
        expect(
          article?.querySelector('a[target="_blank"]')?.getAttribute('href'),
        ).toBe(
          'https://proyectolibera.org/app-basuraleza-caracterizacion-residuos',
        )
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
    ...['jauntjar', 'todo-lux', 'basuraleza'].map((id) => [
      `/proyectos/${id}`,
      `/en/projects/${id}`,
    ]),
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
