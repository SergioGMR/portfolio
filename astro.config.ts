import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { SITE_URL } from './src/lib/site'

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  output: 'static',
  build: {},

  integrations: [],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: { enabled: process.env.VERCEL_ENV === 'production' },
  }),
})
