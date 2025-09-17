import { useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'

type Language = 'es' | 'en'

declare global {
  interface Window {
    portfolioLanguage?: {
      setLanguage?: (lang: Language) => void
      getLanguage?: () => Language
    }
  }
}

const esFlag = '/flags/es.webp'
const enFlag = '/flags/en.webp'

const LangToggle = () => {
  const [language, setLanguage] = useState<Language>('es')
  const [isWindows, setIsWindows] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored =
      (window.portfolioLanguage?.getLanguage?.() ??
        (localStorage.getItem('language') as Language | null)) || 'es'

    setLanguage(stored)
    setIsWindows(window.navigator.platform.toLowerCase().includes('win'))

    const handleLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: Language }>).detail
      if (detail?.language === 'es' || detail?.language === 'en') {
        setLanguage(detail.language)
      }
    }

    window.addEventListener('languageChange', handleLanguageChange)

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange)
    }
  }, [])

  const setLanguagePreference = (lang: Language) => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.portfolioLanguage?.setLanguage) {
      window.portfolioLanguage.setLanguage(lang)
    } else {
      localStorage.setItem('language', lang)
      window.dispatchEvent(
        new CustomEvent('languageChange', { detail: { language: lang } }),
      )
    }
  }

  const toggleLanguage = () => {
    const nextLanguage: Language = language === 'es' ? 'en' : 'es'
    setLanguage(nextLanguage)
    setLanguagePreference(nextLanguage)
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={buttonVariants({ variant: 'ghost' })}
      aria-label="Toggle language"
    >
      {language === 'es'
        ? isWindows
          ? (
              <img
                className="h-[1.2rem] w-7 rounded"
                src={esFlag}
                alt="Español"
              />
            )
          : (
              '🇪🇸'
            )
        : isWindows
        ? (
            <img
              className="h-[1.2rem] w-7 rounded"
              src={enFlag}
              alt="English"
            />
          )
        : (
            '🇬🇧'
          )}
    </button>
  )
}

export { LangToggle }
export default LangToggle
