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

/** Enhance real language links without changing URL-owned content or metadata. */
export function initializeLanguage(
  document: Document,
  _storage: LanguageStorage | null,
): () => void {
  const updateHashes = () => {
    const hash = document.defaultView?.location.hash ?? ''
    document
      .querySelectorAll<HTMLAnchorElement>('[data-language-link]')
      .forEach((link) => {
        const path = link.getAttribute('href')?.split('#')[0]
        if (path === '/' || path === '/en')
          link.setAttribute('href', `${path}${hash}`)
      })
  }
  updateHashes()
  document.defaultView?.addEventListener('hashchange', updateHashes)
  return () =>
    document.defaultView?.removeEventListener('hashchange', updateHashes)
}

export function initializeBrowserLanguage(): void {
  initializeLanguage(document, null)
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
