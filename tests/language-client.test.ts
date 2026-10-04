// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  initializeLanguage,
  serializeLanguageMetadata,
  type LanguageMetadata,
  type LanguageStorage,
} from '../src/lib/language-client'
import { PAGE_METADATA } from '../src/lib/page-metadata'

const metadata = PAGE_METADATA.home

let cleanup = () => undefined

const createStorage = (initial: string | null): LanguageStorage => {
  let value = initial

  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key, next) => {
      value = next
    }),
  }
}

const metaContent = (selector: string) =>
  document.querySelector<HTMLMetaElement>(selector)?.content

const expectLanguage = (
  language: 'es' | 'en',
  pageMetadata: LanguageMetadata = metadata,
) => {
  const entry = pageMetadata[language]
  const other = language === 'es' ? 'en' : 'es'

  expect(document.documentElement.lang).toBe(language)
  expect(document.title).toBe(entry.title)
  expect(metaContent('meta[name="description"]')).toBe(entry.description)
  expect(metaContent('meta[property="og:title"]')).toBe(entry.title)
  expect(metaContent('meta[property="og:description"]')).toBe(entry.description)
  expect(metaContent('meta[property="og:locale"]')).toBe(
    language === 'es' ? 'es_ES' : 'en_US',
  )
  expect(metaContent('meta[property="og:image:alt"]')).toBe(entry.imageAlt)
  expect(metaContent('meta[property="twitter:title"]')).toBe(entry.title)
  expect(metaContent('meta[property="twitter:description"]')).toBe(
    entry.description,
  )
  expect(metaContent('meta[property="twitter:image:alt"]')).toBe(entry.imageAlt)
  expect(
    document
      .querySelector(`[data-lang-content="${language}"]`)
      ?.classList.contains('hidden'),
  ).toBe(false)
  expect(
    document
      .querySelector(`[data-lang-content="${other}"]`)
      ?.classList.contains('hidden'),
  ).toBe(true)
  expect(
    document.querySelector<HTMLSelectElement>('[data-lang-select]')?.value,
  ).toBe(language)
  expect(
    document
      .querySelector(`[data-lang-option="${language}"]`)
      ?.getAttribute('aria-pressed'),
  ).toBe('true')
  expect(
    JSON.parse(
      document.querySelector('[data-language-schema]')?.textContent ?? '{}',
    ),
  ).toEqual(entry.schema)
}

const renderFixture = (pageMetadata: LanguageMetadata) => {
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
  renderFixture(metadata)
})

afterEach(() => cleanup())

describe('language client', () => {
  it.each([
    ['homepage', PAGE_METADATA.home],
    ['AceZone terms', PAGE_METADATA.acezone],
    ['Wattly terms', PAGE_METADATA.wattly],
  ])(
    'restores saved English metadata for the %s page',
    (_name, pageMetadata) => {
      renderFixture(pageMetadata)
      cleanup = initializeLanguage(document, createStorage('en'))

      expectLanguage('en', pageMetadata)
    },
  )

  it('round trips ES to EN to ES through both controls', () => {
    const storage = createStorage('es')
    cleanup = initializeLanguage(document, storage)

    document
      .querySelector('[data-lang-option="en"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expectLanguage('en')

    const select =
      document.querySelector<HTMLSelectElement>('[data-lang-select]')
    if (!select) throw new Error('Language select missing from fixture')
    select.value = 'es'
    select.dispatchEvent(new Event('change', { bubbles: true }))

    expectLanguage('es')
    expect(storage.setItem).toHaveBeenLastCalledWith('language', 'es')
  })

  it('falls back to Spanish when storage is invalid or blocked', () => {
    cleanup = initializeLanguage(document, createStorage('fr'))
    expectLanguage('es')
    cleanup()

    const blocked: LanguageStorage = {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('Blocked', 'SecurityError')
      },
    }

    expect(() => {
      cleanup = initializeLanguage(document, blocked)
    }).not.toThrow()
    expectLanguage('es')

    document
      .querySelector('[data-lang-option="en"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expectLanguage('en')
  })

  it('escapes closing script text without changing metadata values', () => {
    const unsafe = structuredClone(metadata)
    unsafe.en.description = '</script><script>alert(1)</script>'

    const serialized = serializeLanguageMetadata(unsafe)

    expect(serialized).not.toContain('</script>')
    expect(JSON.parse(serialized)).toEqual(unsafe)
  })
})
