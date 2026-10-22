import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { SITE_URL } from './src/lib/site'

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  output: 'static',
  trailingSlash: 'never',
  build: {},

  // Legacy year-stamped CV URLs; `vercel.json` is not copied into the adapter
  // output, so the redirects live here where they can be verified locally.
  redirects: {
    '/sergio-morales-2024-es.pdf': {
      status: 301,
      destination: '/sergio-morales-es.pdf',
    },
    '/sergio-morales-2024-en.pdf': {
      status: 301,
      destination: '/sergio-morales-en.pdf',
    },
  },

  integrations: [],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: { enabled: process.env.VERCEL_ENV === 'production' },
  }),
})
