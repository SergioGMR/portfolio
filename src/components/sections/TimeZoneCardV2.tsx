import { useEffect, useMemo, useState } from 'react'

type Language = 'es' | 'en'

type Props = {
  timezone: string
}

declare global {
  interface Window {
    portfolioLanguage?: {
      getLanguage?: () => Language
    }
    portfolioTranslations?: Record<Language, any>
  }
}

const FALLBACK_TRANSLATIONS = {
  es: {
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches',
    location: '🇮🇨 Islas Canarias, España 🇪🇸',
  },
  en: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    location: '🇮🇨 Canary Islands, Spain 🇪🇸',
  },
} satisfies Record<Language, {
  morning: string
  afternoon: string
  evening: string
  location: string
}>

const resolveLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'es'
  }
  const stored = window.portfolioLanguage?.getLanguage?.() ||
    (localStorage.getItem('language') as Language | null)
  return stored === 'en' ? 'en' : 'es'
}

const getTranslations = (language: Language) => {
  if (typeof window === 'undefined') {
    return FALLBACK_TRANSLATIONS[language]
  }

  const fromTranslations = window.portfolioTranslations?.[language]?.time

  return {
    ...FALLBACK_TRANSLATIONS[language],
    ...(typeof fromTranslations === 'object' ? fromTranslations : {}),
  }
}

const TimeZoneCardV2 = ({ timezone }: Props) => {
  const [language, setLanguage] = useState<Language>(resolveLanguage)
  const [dateText, setDateText] = useState('')
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const translations = getTranslations(language)

    const formatDate = () => {
      const locale = language === 'es' ? 'es-ES' : 'en-GB'
      const formatted = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(new Date())

      const hour24 = Number(
        new Intl.DateTimeFormat('en-GB', {
          hour: 'numeric',
          hour12: false,
          timeZone: timezone,
        }).format(new Date()),
      )

      if (!Number.isNaN(hour24)) {
        if (hour24 >= 5 && hour24 < 12) {
          setGreeting(translations.morning)
        } else if (hour24 >= 12 && hour24 < 20) {
          setGreeting(translations.afternoon)
        } else {
          setGreeting(translations.evening)
        }
      }

      setDateText(formatted)
    }

    formatDate()
    const interval = window.setInterval(formatDate, 1000)

    const handleLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: Language }>).detail
      if (detail?.language === 'es' || detail?.language === 'en') {
        setLanguage(detail.language)
      } else {
        setLanguage(resolveLanguage())
      }
    }

    window.addEventListener('languageChange', handleLanguageChange)

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange)
      window.clearInterval(interval)
    }
  }, [language, timezone])

  const translations = useMemo(() => getTranslations(language), [language])

  return (
    <div className="flex h-full flex-col items-center justify-between text-center">
      <h2 className="m-0 text-xl font-bold">{greeting || translations.morning}</h2>
      <p className="font-mono text-sm">{dateText}</p>
      <p className="text-sm text-gray-500">{translations.location}</p>
    </div>
  )
}

export default TimeZoneCardV2
