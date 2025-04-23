import { EXPERIENCE } from './constants';

// Define language type
export type Language = 'es' | 'en';

// Define type structure for translations
export interface TranslationItem {
    [key: string]: string | string[] | TranslationItem;
}

export interface Translations {
    es: {
        intro: TranslationItem;
        footer: TranslationItem;
        about: TranslationItem;
        now: TranslationItem;
        study: TranslationItem;
        experience: TranslationItem;
        contact: TranslationItem;
        cv: TranslationItem;
        popcorn: TranslationItem;
        cat: {
            texts: string[];
        };
        time: TranslationItem;
    };
    en: {
        intro: TranslationItem;
        footer: TranslationItem;
        about: TranslationItem;
        now: TranslationItem;
        study: TranslationItem;
        experience: TranslationItem;
        contact: TranslationItem;
        cv: TranslationItem;
        popcorn: TranslationItem;
        cat: {
            texts: string[];
        };
        time: TranslationItem;
    };
}

// Define TypeScript for the global window objects
declare global {
    interface Window {
        portfolioLanguage?: {
            setLanguage: (lang: Language) => void;
            getLanguage: () => Language;
            updateTextContent: (elementId: string, keyPath: string) => void;
        };
        portfolioTranslations?: Translations;

        // Define the custom event types
        dispatchEvent(event: Event): boolean;
        dispatchEvent(event: CustomEvent<{ language: Language }>): boolean;
    }
}

// Define all translations in one central location
export const translations: Translations = {
    en: {
        // IntroCard
        intro: {
            welcome: 'Welcome',
            title: "Hi, my name's ",
            name: 'Sergio Morales Rodríguez.',
            description: 'I am a technology and web development enthusiast, with experience in modern frameworks. I love combining technical functionality with design to create efficient and attractive solutions.',
        },
        // Footer
        footer: {
            from: '"Forked" from',
            by: 'Modded with 💜 using Astro and Tailwind CSS by',
            source: 'The source code is available on',
        },
        // About Me
        about: {
            welcome: 'About me',
            title: 'I am ',
            name: 'Sergio Morales Rodríguez,',
            description: ' a fullstack developer focused on backend.',
            tools: 'The tools I usually use include:',
            beyond: "Beyond coding, I'm passionate about procedural series, video games like League of Legends, movies and above all, traveling. ( Not counting my cats, Ginny and Sirius ).",
        },
        // Now card
        now: {
            title: 'What are u doing now?',
            what: "what's that?",
            currently: 'working as freelancer',
            found: 'foundme at:',
        },
        // Study card
        study: {
            text: 'Studies',
        },
        // Experience card
        experience: {
            title: 'Experience',
            button: 'View More',
        },
        // Contact card
        contact: {
            title: 'Work together?',
            contactDetails: 'Contact Details',
            paradise: '🇮🇨 Canary Islands, Spain 🇪🇸',
        },
        // CV card
        cv: {
            title: 'Resume',
            button: 'Download resume',
        },
        // Popcorn card
        popcorn: {
            text: 'I love movies and series, and of course, popcorn.',
        },
        // Cat card
        cat: {
            texts: ['A cat.', 'Hello Karen', 'My favorite cat is a cat.'],
        },
        // Time card
        time: {
            morning: 'Good morning',
            afternoon: 'Good afternoon',
            evening: 'Good evening',
            location: '🇮🇨 Canary Islands, Spain 🇪🇸'
        },
    },
    es: {
        // IntroCard
        intro: {
            welcome: 'Bienvenido',
            title: 'Hola, me llamo ',
            name: 'Sergio Morales Rodríguez.',
            description: 'Soy una persona apasionada por la tecnología y el desarrollo web, con experiencia en frameworks modernos. Me encanta combinar funcionalidad técnica con diseño para crear soluciones eficientes y atractivas.',
        },
        // Footer
        footer: {
            from: '"Bifurcado" de',
            by: 'Modificado con 💜 usando Astro y Tailwind CSS por',
            source: 'El código fuente está disponible en',
        },
        // About Me
        about: {
            welcome: 'Sobre mí',
            title: 'Soy ',
            name: 'Sergio Morales Rodríguez,',
            description: ' desarrollador fullstack centrado en backend.',
            tools: 'Las que suelo usar incluyen:',
            beyond: 'Además de programar, me gustan las series procedimentales, los videojuegos, el cine y sobre todo, viajar. ( Sin contar mis gatos, Ginny y Sirius ).',
        },
        // Now card
        now: {
            title: '¿En qué estás ahora?',
            what: '¿eso qué es?',
            currently: 'trabajando como freelance',
            found: 'encuentrame en:',
        },
        // Study card
        study: {
            text: 'Estudios',
        },
        // Experience card
        experience: {
            title: 'Experiencia',
            button: 'Ver Más',
        },
        // Contact card
        contact: {
            title: '¿Trabajamos juntos?',
            contactDetails: 'Detalles de contacto',
            paradise: '🇮🇨 Islas Canarias, España 🇪🇸',
        },
        // CV card
        cv: {
            title: 'Currículum',
            button: 'Descargar currículum',
        },
        // Popcorn card
        popcorn: {
            text: 'Me encanta el cine y las series, y por supuesto, las palomitas.',
        },
        // Cat card
        cat: {
            texts: ['Un gato.', 'Hola Karen', 'Mi gato favorito es un gato.'],
        },
        // Time card
        time: {
            morning: 'Buenos días',
            afternoon: 'Buenas tardes',
            evening: 'Buenas noches',
            location: '🇮🇨 Islas Canarias, España 🇪🇸'
        },
    }
};

export type TranslationKey = keyof typeof translations.en;

// Helper function to get a translation by key path
export function getTranslation(lang: Language, keyPath: string): any {
    const keys = keyPath.split('.');
    let value: any = translations[lang];

    for (const key of keys) {
        if (value === undefined) return undefined;
        value = value[key];
    }

    return value;
}

// Global store for experience data
export function getExperienceData(lang: Language) {
    return EXPERIENCE[lang];
}

// Create a language service script to be included in the head
export const languageServiceScript = `
  // Initialize language from localStorage or default to 'es'
  let currentLanguage = localStorage.getItem('language') || 'es';
  
  // Set language in localStorage and dispatch event
  function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    window.dispatchEvent(new CustomEvent('language-change', { detail: { language: lang } }));
  }
  
  // Get current language
  function getLanguage() {
    return currentLanguage;
  }
  
  // Initialize text content for an element with a specific translation key
  function updateTextContent(elementId, keyPath) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Fetch translations from the global object
    const translations = window.portfolioTranslations || {};
    const lang = getLanguage();
    
    // Navigate the key path to get the translation
    const keys = keyPath.split('.');
    let value = translations[lang];
    
    for (const key of keys) {
      if (!value) return;
      value = value[key];
    }
    
    if (value) {
      element.textContent = value;
    }
  }
  
  // Initialize all elements with data-i18n attributes
  function initializeI18nElements() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const keyPath = element.getAttribute('data-i18n');
      const elementId = element.id;
      if (keyPath && elementId) {
        updateTextContent(elementId, keyPath);
      }
    });
  }
  
  // Listen for language change events
  window.addEventListener('language-change', () => {
    initializeI18nElements();
  });
  
  // Initialize when the DOM is ready
  document.addEventListener('DOMContentLoaded', initializeI18nElements);
  
  // Initialize after Astro view transitions
  document.addEventListener('astro:after-swap', initializeI18nElements);
  
  // Make the functions available globally
  window.portfolioLanguage = {
    setLanguage,
    getLanguage,
    updateTextContent
  };
`;