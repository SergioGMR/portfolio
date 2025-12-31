import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: process.env.CI
    ? 'https://sergiogmr.vercel.app/'
    : 'http://localhost:4321',

  output: 'server',
  build: {},

  integrations: [],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
})
