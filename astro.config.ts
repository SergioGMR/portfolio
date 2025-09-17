import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  site: process.env.CI
    ? 'https://sergiogmr.vercel.app/'
    : 'http://localhost:4321',

  output: 'server',
  build: {},

  integrations: [
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    speedInsights: {
      enabled: true,
    },
  }),
})
