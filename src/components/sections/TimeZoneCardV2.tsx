import { date, set } from 'astro:schema';
import { useState, useEffect } from 'react'

const Timezone = ({ timezone }: any) => {
  const [text, setText] = useState<string>('')
  const [greeting, setGreeting] = useState<string>('Cargando...')
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
    }
  } = {
    es: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
      location: '🇮🇨 Islas Canarias, España 🇪🇸'
    },
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      location: '🇮🇨 Canary Islands, Spain 🇪🇸'
    },
  }

  const getFormattedTime = (locale: string) => {
    const currentTime = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: locale === 'es' ? timezone : 'Europe/London'
    };
    return currentTime.toLocaleString(locale, options);
  };

  const getGreeting = (time: string) => {
    const [datePart, timePart] = time.split(',');
    const [hourString, minuteString, secondString] = timePart.trim().split(':');
    let hour = parseInt(hourString);

    if (timePart.includes('PM') && hour !== 12) {
      hour += 12;
    } else if (timePart.includes('AM') && hour === 12) {
      hour = 0;
    }

    if (hour >= 5 && hour < 12) {
      return timeTexts[language].morning;
    } else if (hour >= 12 && hour < 20) {
      return timeTexts[language].afternoon;
    } else {
      return timeTexts[language].evening;
    }
  }

  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(getFormattedTime(language));
      setGreeting(getGreeting(getFormattedTime(language)));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    setText(timeTexts[language].location);
    if (dateTime) {
      setGreeting(getGreeting(dateTime));
    }
    const handleLanguageChange = (event: CustomEvent) => {
      const newLanguage = event.detail.language;
      setLanguage(newLanguage);
      setText(timeTexts[newLanguage].location);
      if (dateTime) {
        setGreeting(getGreeting(dateTime));
      }
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, [timezone, language]);

  return (
    <div className='flex flex-col h-full justify-between items-center'>
      <h2 className='z-20 m-0 text-xl font-bold'>{greeting}</h2>
      <p>{dateTime}</p>
      <p className="text-sm text-gray-500">
        <span>{text}</span>
      </p>
    </div>
  )
}

export default Timezone
