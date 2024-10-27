import React, { useState, useEffect } from 'react';
import { buttonVariants } from '@/components/ui/button';
const esFlag = '/flags/es.webp';
const enFlag = '/flags/en.webp';

const LangToggle: React.FC = () => {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'es';
    }
    return 'es';
  });
  const [isWindows, setIsWindows] = useState<boolean>(false);

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);

    // Lanzar evento personalizado
    const event = new CustomEvent('languageChange', { detail: { language: newLanguage } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }

    const platform = window.navigator.platform.toLowerCase();
    setIsWindows(platform.includes('win'));
  }, []);

  return (
    <button
      className={buttonVariants({ variant: 'ghost' })}
      onClick={toggleLanguage}
    >
      {language === 'es' ? (
        isWindows ? (
          <img className="h-5 w-auto rounded" src={esFlag} alt="Español" />
        ) : (
          '🇪🇸'
        )
      ) : isWindows ? (
        <img className="h-5 w-auto rounded" src={enFlag} alt="English" />
      ) : (
        '🇬🇧'
      )}
    </button>
  );
};

export { LangToggle };