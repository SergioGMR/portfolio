# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # dev server at http://localhost:4321
bun run build    # static build
bun run preview  # preview built output
bun run format   # prettier formatting
```

Package manager is **bun** (not npm/yarn). Node ≥ 22 required.

## Architecture

Astro 7 static site (`output: 'static'`) deployed to Vercel. No React — pure Astro components with Tailwind CSS v4 (via Vite plugin, no config file).

### Bilingual i18n system

The i18n system is **entirely custom, no Astro i18n integration**:

- `src/lib/language.ts` — central store of all UI translations (`translations.es` / `translations.en`) and `EXPERIENCE` data, plus a `languageServiceScript` string (vanilla JS injected inline)
- `src/lib/constants.ts` — `LINKS`, `STACK`, and `EXPERIENCE` data
- `src/components/LanguageService.astro` — injects translations as `window.portfolioTranslations` and the language service as `window.portfolioLanguage`; language preference persisted to `localStorage`
- `src/components/LangText.astro` — renders two `<span data-lang-content="es|en">` siblings; CSS/JS hides the inactive one

**Pattern for bilingual content**: use `<LangText es="..." en="..." />` for inline text. For blocks, use `data-lang-content="es"` / `data-lang-content="en"` on wrapper elements. The JS in `LanguageService` toggles visibility on `languageChange` events.

### Theme system

Dark/light toggle via `ThemeToggleLite.astro` — sets `class="dark"` on `<html>`. Tailwind CSS variables follow shadcn-style (`--foreground`, `--background`, `--card`, `--muted`, `--border`, `--primary`).

### Layout hierarchy

```
BasePage.astro       ← <html>, <head>, HeadSEO, global styles
  └── PageShell.astro  ← sticky header, <main>, footer, scroll-animation observer
        └── page content via <slot />
```

### Scroll-triggered animations

`PageShell.astro` includes an inline `IntersectionObserver` script. Elements with `data-animate` and optionally `data-animate-delay="Xms"` are hidden on load and revealed with lightweight opacity/transform transitions when they enter the viewport.

### Adding/editing content

All portfolio content (experience, links, stack) lives in `src/lib/constants.ts`. Translations live in `src/lib/language.ts`. Both `es` and `en` keys must be updated together.

### Dynamic sitemap

`src/pages/sitemap.xml.ts` generates the sitemap at build time — no static sitemap file.
