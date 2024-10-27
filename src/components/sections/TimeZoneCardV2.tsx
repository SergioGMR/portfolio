import { useState, useEffect } from 'react'
import moment from 'moment-timezone'
import { set } from 'astro:schema'

const Timezone = ({ timezone }: any) => {
  const [text, setText] = useState<string>('')
  const [format, setFormat] = useState<string>('d/M/Y [a las] HH:mm:ss')
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'es';
    }
    return 'es';
  });

  const [dateTime, setDateTime] = useState('')
  const timeTexts: {
    [key: string]: {
      morning: string
      afternoon: string
      evening: string
      location: string
      format: string
    }
  } = {
    es: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
      location: 'Islas Canarias, España',
      format: 'd/M/Y [a las] HH:mm:ss',
    },
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      location: 'Canary Islands, Spain',
      format: 'M/d/Y [at] HH:mm:ss',
    },
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment().tz(timezone)
      setDateTime(now.format(format))
    }, 1000)

    return () => clearInterval(interval)
  }, [timezone])
  // Escuchar el evento personalizado 'languageChange'
  useEffect(() => {
    setText(timeTexts[language].location); // Actualizar el texto de acuerdo al idioma actual
    const handleLanguageChange = (event: CustomEvent) => {
      const newLanguage = event.detail.language;
      setFormat(timeTexts[newLanguage].format);
      setLanguage(newLanguage);
      setText(timeTexts[newLanguage].location); // Actualizar el texto de acuerdo al nuevo idioma
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  return (
    <div>
      <p>{dateTime}</p>
      <p className="text-sm text-gray-500">
        <span>{text}</span>
      </p>
    </div>
  )
}

export default Timezone
