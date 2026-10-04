import type {
  Language,
  LanguageMetadata,
  LanguageMetadataEntry,
} from './language-client'
import { LINKS } from './constants'
import { SITE_URL } from './site'

const PORTFOLIO_URL = new URL('/', SITE_URL).toString()

const createAuthor = (url: string) => ({
  '@type': 'Person',
  name: 'Sergio Morales Rodríguez',
  url,
  jobTitle: 'Tech Lead Full Stack',
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
      author: createAuthor(canonical),
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
      title: 'Sergio Morales Rodríguez — Tech Lead Full Stack',
      description:
        'Portfolio de Sergio Morales Rodríguez, Tech Lead Full Stack especializado en liderazgo técnico, arquitectura, APIs y entrega de producto.',
      imageAlt: 'Presentación del portfolio de Sergio Morales Rodríguez',
      schema: {
        ...personIdentity,
        jobTitle: 'Tech Lead Full Stack',
        description:
          'Tech Lead Full Stack especializado en liderazgo técnico, arquitectura, APIs y entrega de producto.',
      },
    },
    en: {
      title: 'Sergio Morales Rodríguez — Tech Lead Full Stack',
      description:
        'Portfolio of Sergio Morales Rodríguez, a Tech Lead Full Stack focused on technical leadership, architecture, APIs, and product delivery.',
      imageAlt: 'Sergio Morales Rodríguez portfolio preview',
      schema: {
        ...personIdentity,
        jobTitle: 'Tech Lead Full Stack',
        description:
          'Tech Lead Full Stack focused on technical leadership, architecture, APIs, and product delivery.',
      },
    },
  },
  acezone: createTermsMetadata('AceZone', '/acezone/tos'),
  wattly: createTermsMetadata('Wattly', '/wattly/tos'),
} satisfies Record<string, LanguageMetadata>
