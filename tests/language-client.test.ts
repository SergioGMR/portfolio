import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'

import {
  initializeLanguage,
  serializeJsonForScript,
  type LanguageMetadata,
} from '../src/lib/language-client'
import { PAGE_METADATA } from '../src/lib/page-metadata'

const metadata = PAGE_METADATA.home

let browser: Window
let document: Document
let cleanup: () => void = () => undefined

const metaContent = (selector: string) =>
  document.querySelector<HTMLMetaElement>(selector)?.content

const renderFixture = (pageMetadata: LanguageMetadata) => {
  document.documentElement.lang = 'es'
  document.documentElement.innerHTML = `
    <head>
      <title>${pageMetadata.es.title}</title>
      <meta name="description" content="${pageMetadata.es.description}">
      <meta property="og:title" content="${pageMetadata.es.title}">
      <meta property="og:description" content="${pageMetadata.es.description}">
      <meta property="og:locale" content="es_ES">
      <meta property="og:image:alt" content="${pageMetadata.es.imageAlt}">
      <meta property="twitter:title" content="${pageMetadata.es.title}">
      <meta property="twitter:description" content="${pageMetadata.es.description}">
      <meta property="twitter:image:alt" content="${pageMetadata.es.imageAlt}">
      <script type="application/ld+json">${serializeJsonForScript(pageMetadata.es.schema)}</script>
    </head>
    <body>
      <span data-lang-content="es">Español</span>
      <span data-lang-content="en">English</span>
      <a data-language-link href="/" hreflang="es">ES</a>
      <a data-language-link href="/en" hreflang="en">EN</a>
    </body>`
}

beforeEach(() => {
  browser = new Window({ url: 'https://sgmr.dev/' })
  document = browser.document as unknown as Document
  renderFixture(metadata)
})

afterEach(() => {
  cleanup()
  cleanup = () => undefined
  browser.close()
})

describe('language client', () => {
  test('keeps Spanish URL metadata when storage prefers English', () => {
    browser.localStorage.setItem('language', 'en')
    document.documentElement.lang = 'es'
    cleanup = initializeLanguage(document)
    expect(document.documentElement.lang).toBe('es')
    expect(document.title).toBe(metadata.es.title)
    expect(metaContent('meta[name="description"]')).toBe(
      metadata.es.description,
    )
    expect(browser.localStorage.getItem('language')).toBe('en')
  })

  test('keeps English URL metadata when storage prefers Spanish or throws', () => {
    document.documentElement.lang = 'en'
    document.title = metadata.en.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', metadata.en.description)
    browser.localStorage.setItem('language', 'es')
    cleanup = initializeLanguage(document)
    expect(document.documentElement.lang).toBe('en')
    expect(metaContent('meta[name="description"]')).toBe(
      metadata.en.description,
    )
    expect(browser.localStorage.getItem('language')).toBe('es')
    cleanup()
    for (const method of ['getItem', 'setItem']) {
      Object.defineProperty(browser.localStorage, method, {
        value: () => {
          throw new Error('blocked')
        },
      })
    }
    expect(() => {
      cleanup = initializeLanguage(document)
    }).not.toThrow()
    expect(document.documentElement.lang).toBe('en')
  })

  test('keeps real language navigation links and carries home section hash', () => {
    browser.location.hash = '#proyectos'
    document.body.innerHTML = '<a data-language-link href="/en">English</a>'
    cleanup = initializeLanguage(document)
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en#proyectos',
    )
    expect(document.documentElement.lang).toBe('es')
  })

  test('updates shared fragments on equivalent pages and removes its listener on cleanup', () => {
    browser.location.hash = '#main-content'
    document.body.innerHTML =
      '<main id="main-content"></main><a data-language-link href="/en/acezone/tos#main-content">English</a>'
    browser.localStorage.setItem('language', 'en')
    cleanup = initializeLanguage(document)
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en/acezone/tos#main-content',
    )
    browser.location.hash = ''
    browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en/acezone/tos',
    )
    browser.location.hash = '#main-content'
    browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en/acezone/tos#main-content',
    )
    cleanup()
    browser.location.hash = ''
    browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en/acezone/tos#main-content',
    )
    expect(browser.localStorage.getItem('language')).toBe('en')
  })

  test('escapes closing script text without changing metadata values', () => {
    const unsafe = structuredClone(metadata)
    unsafe.en.description = '</script><script>alert(1)</script>'

    const serialized = serializeJsonForScript(unsafe)

    expect(serialized).not.toContain('</script>')
    expect(JSON.parse(serialized)).toEqual(unsafe)
  })
})
