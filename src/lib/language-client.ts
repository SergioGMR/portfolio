export type Language = 'es' | 'en'

export interface LanguageMetadataEntry {
  title: string
  description: string
  imageAlt: string
  schema?: Record<string, unknown>
}

export type LanguageMetadata = Record<Language, LanguageMetadataEntry>

export interface LanguageStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const LANGUAGE_KEY = 'language'
const DEFAULT_LANGUAGE: Language = 'es'

const isLanguage = (value: unknown): value is Language =>
  value === 'es' || value === 'en'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isMetadataEntry = (value: unknown): value is LanguageMetadataEntry =>
  isRecord(value) &&
  typeof value.title === 'string' &&
  typeof value.description === 'string' &&
  typeof value.imageAlt === 'string' &&
  (value.schema === undefined || isRecord(value.schema))

const readMetadata = (document: Document): LanguageMetadata | null => {
  const source = document.querySelector<HTMLScriptElement>(
    '[data-language-metadata]',
  )?.textContent
  if (!source) return null

  try {
    const parsed: unknown = JSON.parse(source)
    if (
      !isRecord(parsed) ||
      !isMetadataEntry(parsed.es) ||
      !isMetadataEntry(parsed.en)
    )
      return null

    return { es: parsed.es, en: parsed.en }
  } catch {
    return null
  }
}

const setMetaContent = (
  document: Document,
  selector: string,
  content: string,
) => {
  document
    .querySelector<HTMLMetaElement>(selector)
    ?.setAttribute('content', content)
}

const applyLanguage = (
  document: Document,
  language: Language,
  metadata: LanguageMetadata | null,
) => {
  document.documentElement.lang = language
  document
    .querySelectorAll<HTMLElement>('[data-lang-content]')
    .forEach((element) => {
      element.classList.toggle(
        'hidden',
        element.dataset.langContent !== language,
      )
    })
  document
    .querySelectorAll<HTMLElement>('[data-lang-option]')
    .forEach((button) => {
      const active = button.dataset.langOption === language
      button.dataset.active = String(active)
      button.setAttribute('aria-pressed', String(active))
    })
  document
    .querySelectorAll<HTMLSelectElement>('[data-lang-select]')
    .forEach((select) => {
      select.value = language
    })

  const entry = metadata?.[language]
  if (entry) {
    document.title = entry.title
    setMetaContent(document, 'meta[name="description"]', entry.description)
    setMetaContent(document, 'meta[property="og:title"]', entry.title)
    setMetaContent(
      document,
      'meta[property="og:description"]',
      entry.description,
    )
    setMetaContent(
      document,
      'meta[property="og:locale"]',
      language === 'es' ? 'es_ES' : 'en_US',
    )
    setMetaContent(document, 'meta[property="og:image:alt"]', entry.imageAlt)
    setMetaContent(document, 'meta[property="twitter:title"]', entry.title)
    setMetaContent(
      document,
      'meta[property="twitter:description"]',
      entry.description,
    )
    setMetaContent(
      document,
      'meta[property="twitter:image:alt"]',
      entry.imageAlt,
    )

    const schema = document.querySelector<HTMLScriptElement>(
      '[data-language-schema]',
    )
    if (schema && entry.schema)
      schema.textContent = JSON.stringify(entry.schema)
  }

  const view = document.defaultView
  view?.dispatchEvent(
    new view.CustomEvent('languageChange', {
      detail: { language },
    }),
  )
}

export function initializeLanguage(
  document: Document,
  storage: LanguageStorage | null,
): () => void {
  const metadata = readMetadata(document)
  const view = document.defaultView
  let saved: string | null = null
  try {
    saved = storage?.getItem(LANGUAGE_KEY) ?? null
  } catch {
    saved = null
  }

  const selectLanguage = (value: unknown) => {
    const language = isLanguage(value) ? value : DEFAULT_LANGUAGE
    try {
      storage?.setItem(LANGUAGE_KEY, language)
    } catch {
      // Language changes still work when storage is unavailable.
    }
    applyLanguage(document, language, metadata)
  }

  const onChange = (event: Event) => {
    if (
      !view ||
      !(event.target instanceof view.HTMLSelectElement) ||
      !event.target.matches('[data-lang-select]')
    )
      return

    selectLanguage(event.target.value)
  }

  const onClick = (event: Event) => {
    if (!view || !(event.target instanceof view.Element)) return
    const button = event.target.closest<HTMLElement>('[data-lang-option]')
    if (!button) return

    selectLanguage(button.dataset.langOption)
  }

  document.addEventListener('change', onChange)
  document.addEventListener('click', onClick)
  selectLanguage(saved)

  return () => {
    document.removeEventListener('change', onChange)
    document.removeEventListener('click', onClick)
  }
}

export function initializeBrowserLanguage(): void {
  let storage: LanguageStorage | null = null
  try {
    storage = window.localStorage
  } catch {
    storage = null
  }

  initializeLanguage(document, storage)
}

export function serializeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('&', '\\u0026')
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

export function serializeLanguageMetadata(metadata: LanguageMetadata): string {
  return serializeJsonForScript(metadata)
}
