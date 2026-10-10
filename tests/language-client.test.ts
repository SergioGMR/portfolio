import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'

import {
  initializeLanguage,
  serializeLanguageMetadata,
  type LanguageMetadata,
  type LanguageStorage,
} from '../src/lib/language-client'
import { PAGE_METADATA } from '../src/lib/page-metadata'

const metadata = PAGE_METADATA.home

interface RecordingStorage extends LanguageStorage {
  readonly writes: [string, string][]
}

let browser: Window
let document: Document
let cleanup: () => void = () => undefined

const createStorage = (initial: string | null): RecordingStorage => {
  let value = initial
  const writes: [string, string][] = []

  return {
    writes,
    getItem: () => value,
    setItem: (key, next) => {
      value = next
      writes.push([key, next])
    },
  }
}

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
      <script type="application/json" data-language-metadata>${serializeLanguageMetadata(pageMetadata)}</script>
      <script type="application/ld+json" data-language-schema>${JSON.stringify(pageMetadata.es.schema)}</script>
    </head>
    <body>
      <span data-lang-content="es">Español</span>
      <span data-lang-content="en">English</span>
      <select data-lang-select>
        <option value="es">ES</option><option value="en">EN</option>
      </select>
      <button data-lang-option="es" aria-pressed="false">ES</button>
      <button data-lang-option="en" aria-pressed="false">EN</button>
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
    const storage = createStorage('en')
    document.documentElement.lang = 'es'
    cleanup = initializeLanguage(document, storage)
    expect(document.documentElement.lang).toBe('es')
    expect(document.title).toBe(metadata.es.title)
    expect(metaContent('meta[name="description"]')).toBe(
      metadata.es.description,
    )
    expect(storage.writes).toEqual([])
  })

  test('keeps English URL metadata when storage prefers Spanish or throws', () => {
    document.documentElement.lang = 'en'
    document.title = metadata.en.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', metadata.en.description)
    cleanup = initializeLanguage(document, createStorage('es'))
    expect(document.documentElement.lang).toBe('en')
    expect(metaContent('meta[name="description"]')).toBe(
      metadata.en.description,
    )
    cleanup()
    expect(() =>
      initializeLanguage(document, {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
      }),
    ).not.toThrow()
    expect(document.documentElement.lang).toBe('en')
  })

  test('keeps real language navigation links and carries home section hash', () => {
    browser.location.hash = '#proyectos'
    document.body.innerHTML = '<a data-language-link href="/en">English</a>'
    cleanup = initializeLanguage(document, createStorage('es'))
    expect(document.querySelector('a')?.getAttribute('href')).toBe(
      '/en#proyectos',
    )
    expect(document.documentElement.lang).toBe('es')
  })

  test('updates shared fragments on equivalent pages and removes its listener on cleanup', () => {
    browser.location.hash = '#main-content'
    document.body.innerHTML =
      '<main id="main-content"></main><a data-language-link href="/en/acezone/tos#main-content">English</a>'
    const storage = createStorage('en')
    cleanup = initializeLanguage(document, storage)
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
    expect(storage.writes).toEqual([])
  })

  test('escapes closing script text without changing metadata values', () => {
    const unsafe = structuredClone(metadata)
    unsafe.en.description = '</script><script>alert(1)</script>'

    const serialized = serializeLanguageMetadata(unsafe)

    expect(serialized).not.toContain('</script>')
    expect(JSON.parse(serialized)).toEqual(unsafe)
  })
})
