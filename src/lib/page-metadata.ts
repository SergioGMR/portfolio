import type {
  Language,
  LanguageMetadata,
  LanguageMetadataEntry,
} from './language-client'
import { LINKS } from './constants'
import { SITE_URL } from './site'

const PORTFOLIO_URL = new URL('/', SITE_URL).toString()

const createAuthor = (language: Language, url: string) => ({
  '@type': 'Person',
  name: 'Sergio Morales Rodríguez',
  url,
  jobTitle:
    language === 'es' ? 'Desarrollador Full Stack' : 'Full Stack Developer',
  sameAs: [LINKS.github, LINKS.linkedin],
})

const createTermsMetadata = (app: string, path: string): LanguageMetadata => {
  const canonical = new URL(path, SITE_URL).toString()
  const entry = (
    language: Language,
    title: string,
    description: string,
    imageAlt: string,
  ): LanguageMetadataEntry => ({
    title,
    description,
    imageAlt,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Sergio Morales Rodríguez - Portfolio',
      url: PORTFOLIO_URL,
      description,
      inLanguage: language,
      author: createAuthor(language, canonical),
    },
  })

  return {
    es: entry(
      'es',
      `Términos de Servicio — ${app}`,
      `Términos de Servicio de la aplicación ${app}.`,
      `Términos de Servicio de ${app}`,
    ),
    en: entry(
      'en',
      `Terms of Service — ${app}`,
      `Terms of Service for the ${app} application.`,
      `${app} Terms of Service`,
    ),
  }
}

const personIdentity = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sergio Morales Rodríguez',
  sameAs: [LINKS.github, LINKS.linkedin, LINKS.twitter],
}

export const PAGE_METADATA = {
  home: {
    es: {
      title: 'Sergio Morales Rodríguez — Desarrollador Full Stack',
      description:
        'Portfolio de Sergio Morales Rodríguez, desarrollador Full Stack especializado en backend con PHP/Laravel y frontend con TypeScript/React.',
      imageAlt: 'Presentación del portfolio de Sergio Morales Rodríguez',
      schema: {
        ...personIdentity,
        jobTitle: 'Desarrollador Full Stack',
        description:
          'Desarrollador Full Stack especializado en PHP, Laravel, TypeScript y React.',
      },
    },
    en: {
      title: 'Sergio Morales Rodríguez — Full Stack Developer',
      description:
        'Portfolio of Sergio Morales Rodríguez, a Full Stack Developer focused on PHP/Laravel backends and TypeScript/React frontends.',
      imageAlt: 'Sergio Morales Rodríguez portfolio preview',
      schema: {
        ...personIdentity,
        jobTitle: 'Full Stack Developer',
        description:
          'Full Stack Developer specializing in PHP, Laravel, TypeScript, and React.',
      },
    },
  },
  acezone: createTermsMetadata('AceZone', '/acezone/tos/'),
  wattly: createTermsMetadata('Wattly', '/wattly/tos/'),
} satisfies Record<string, LanguageMetadata>
