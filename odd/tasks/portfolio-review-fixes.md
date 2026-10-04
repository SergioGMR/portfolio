# Portfolio review fixes

## Outcome

All four verified CI, SEO, locale-metadata, and reduced-motion findings are
fixed locally on Astro 6.0.8. Each work unit followed strict TDD, passed its
applicable checks, received independent verification, and was committed on the
feature branch. No remote delivery or deployment was authorized or performed.

Recovery pointers:

- Document: `odd/tasks/portfolio-review-fixes.md`
- Engram mirror: `odd/portfolio-review-fixes/tasks`
- Base: `main` at `3c531346c451884b7a2fe7d246ba313b10a6ba39`
- Branch: `fix/portfolio-review-20261004`

## Intent and authorization

- User direction: "Astro 6 es el bueno, soluciona todo", followed by explicit
  approval for local Bun dependency installation, including Vitest and
  `@astrojs/check`.
- Keep Astro 6, the existing visual design, bilingual copy, and the single-URL
  language selector. Do not introduce locale routes.
- Fix only the four verified findings. Remove unsupported `SearchAction` and
  same-URL hreflang claims because the site has neither search nor distinct
  localized resources.
- No push, pull request, merge, publication, deployment, or provider mutation.
- Preserve these unrelated dirty paths byte-for-byte:
  `.atl/skill-registry.md`, `.gitignore`, `.mcp.json`, `CLAUDE.md`,
  `.atl/.skill-registry.cache.json`, and `CLAUDE.md.backup`.

## Execution and delivery policy

- Route: delegated direct for every task.
- Trigger: preparatory reading and each task's multiple non-trivial files.
- Single writer; no parallel source writers.
- Strict TDD source: supplied `AGENTS.md` instructions.
- Test runner: `bun run test` -> `vitest run`.
- Required cycle: observed RED, then GREEN and REFACTOR.
- RDD was globally off. Native assessment was unassessable/high, so independent
  verification was used; no native review was started.
- Delivery strategy: `ask-on-risk`.
- Chain strategy: `feature-branch-chain`, explicitly selected by the user.
- The roughly 400-line ODD task size is an advisory review heuristic, not a
  reason to omit tests, compress code, or create a non-green intermediate.
- Commits are selective Conventional Commit work units without AI attribution.

## Completed work units

### [x] PF-01 — Standardize Bun and establish CI checks

Aligned the project with Bun 1.4.2, added exact local test/check dependencies,
and made CI run frozen install, formatting, Astro checks, tests, and build. The
new gates exposed 15 real baseline errors, which were fixed with typed DOM
queries and union guards while preserving language/theme behavior and the light
theme default. Vercel Analytics remains enabled through its supported adapter;
the duplicate component integration was removed. Two clean-at-base files were
mechanically normalized.

- TDD: focused toolchain test RED `0/2` passing, then GREEN `2/2`.
- Baseline gate remediation: `bun run check` changed from 15 errors to zero.
- Independent verification: passed; parent focused spot: `2/2` tests passed.
- Commit: `fe680dcfce82170f961f938223a7f5e7100d93cd`
- Commit subject: `fix(ci): validate Astro 6 with frozen Bun checks`
- Authored change: 408 additions plus deletions.
- Generated change: `bun.lock`, 272 additions plus deletions, excluded from the
  authored count.
- Files:
  - `.github/workflows/autofix.yml`
  - `bun.lock`
  - `odd/tasks/portfolio-review-fixes.md`
  - `package.json`
  - `src/components/LanguageToggleLite.astro`
  - `src/components/ThemeToggleLite.astro`
  - `src/components/layout/BasePage.astro`
  - `src/components/layout/PageShell.astro`
  - `src/pages/wattly/tos.astro`
  - `tests/toolchain.test.ts`
- Rollback boundary: revert this commit to remove only the Bun/CI gate setup,
  necessary strict-type/integration remediation, normalization, and its test.

### [x] PF-02 — Correct production URLs, sitemap, and robots

Established `https://sgmr.dev` as the production origin independent of CI,
generated the sitemap from the real routes only, removed artificial
modification dates, and corrected the robots sitemap URL while preserving the
crawler rules. A verifier found that the initial TOS paths omitted the trailing
slashes used by built canonicals; the shared route inventory was corrected so
all sitemap URLs equal their page canonicals.

- TDD: initial site test RED `0/3`, then GREEN `3/3`.
- Correction TDD: RED `1 failed, 2 passed`, then GREEN `3/3`.
- Independent verification: passed; parent focused spot: `3/3` tests passed.
- Built route inventory: `/`, `/acezone/tos/`, `/wattly/tos/`.
- Commit: `e3eb31ec0884165c82910323db3b6fb7d8493197`
- Commit subject: `fix(seo): align sitemap and canonical production URLs`
- Authored change: 140 additions plus deletions; no generated lock change.
- Files:
  - `astro.config.ts`
  - `odd/tasks/portfolio-review-fixes.md`
  - `public/robots.txt`
  - `src/lib/site.ts`
  - `src/pages/sitemap.xml.ts`
  - `tests/site.test.ts`
- Rollback boundary: revert this commit to remove only the shared production
  origin, discovery output corrections, and their regression tests.

### [x] PF-03 — Synchronize client language and document metadata

Connected the real homepage and both TOS pages to one typed language client.
ES/EN changes and saved-language restore now update visible copy, active
controls, `html[lang]`, title, description, Open Graph, Twitter metadata, and
localized JSON-LD while preserving schema identities, URLs, and other custom
fields. Invalid or blocked storage falls back safely. Unsupported
`SearchAction`, same-URL hreflang links, and redundant legacy runtime wiring
were removed. Serialized client data is escaped safely.

- TDD: connected Happy DOM behavior RED `0/4`, then GREEN `6/6`.
- Independent verification: passed; parent focused spot: `6/6` tests passed.
- Edge proof: language changes and saved-language application passed across
  the homepage and both TOS pages; homepage reload and keyboard Space toggles
  also passed.
- Commit: `ab8d87fe633cc25003710317e3ef63f47d0a1c27`
- Commit subject: `fix(i18n): synchronize localized document metadata`
- Authored change: 823 additions plus deletions.
- Files:
  - `odd/tasks/portfolio-review-fixes.md`
  - `src/components/HeadSEO.astro`
  - `src/components/LanguageToggleLite.astro`
  - `src/components/layout/BasePage.astro`
  - `src/components/layout/PageShell.astro`
  - `src/lib/language-client.ts`
  - `src/lib/page-metadata.ts`
  - `src/pages/acezone/tos.astro`
  - `src/pages/index.astro`
  - `src/pages/wattly/tos.astro`
  - `tests/language-client.test.ts`
- Rollback boundary: revert this commit to remove only synchronized locale
  metadata behavior, unsupported SEO cleanup, and its regression tests.

### [x] PF-04 — Honor reduced motion for all current animations

Extended the existing reduced-motion preference rule to all current direct
animation classes, including decorative `animate-ping`, while retaining the observer
guard. The override stays after the animation package import and keeps
`animation`, `opacity`, and `transform` important, so imported utilities
cannot restore motion through ordinary cascade order. Normal-motion rules
remain unchanged outside the preference query.

- TDD: focused CSS regression RED `1 failed, 1 passed`, then GREEN `2/2`.
- Independent verification: passed; parent focused spot: `2/2` tests passed.
- Commit: `41a24046ac15fb76da4ef1923009265c87f56fa3`
- Commit subject: `fix(a11y): respect reduced motion for direct animations`
- Authored change: 122 additions plus deletions.
- Files:
  - `odd/tasks/portfolio-review-fixes.md`
  - `src/styles/globals.css`
  - `tests/reduced-motion.test.ts`
- Rollback boundary: revert this commit to remove only the expanded
  reduced-motion selector coverage and its regression test.

## Acceptance and final verification

The implemented behavior and automated local checks passed, with browser proof
gaps recorded below:

- Astro 6.0.8 is retained with Bun-based frozen CI gates.
- Production canonicals, sitemap, and robots consistently use `sgmr.dev` and
  expose only the three real indexable routes.
- The one-URL language selector synchronizes visible and document metadata in
  both languages, including restore and storage fallbacks.
- Unsupported search and same-resource alternate-language claims are absent.
- Reduced motion covers observer-driven and direct hero/pulse animations
  without changing normal motion.

Final independent verification against the completed branch:

| Check                  | Observed result                 |
| ---------------------- | ------------------------------- |
| `bun ci`               | Passed                          |
| `bun run format:check` | Passed                          |
| `bun run check`        | Passed: 18 files, 0 diagnostics |
| `bun run test`         | Passed: 13 tests                |
| `bun run build`        | Passed: 4 pages                 |
| `git diff --check`     | Passed                          |

Built output confirmed stable canonicals, sitemap/robots alignment, localized
SEO payloads, one Analytics loader per page, and the effective reduced-motion
CSS cascade. Preview and browser resources opened for verification were closed.

## Proof boundaries

- Edge verified visible language behavior, persisted reload, and keyboard
  toggles. Head metadata and JSON-LD were verified through source-connected
  Happy DOM behavior and built output, not direct Edge head inspection.
- Browser reduced-motion emulation and mobile resize were unavailable. Compiled
  CSS cascade and DOM selector evidence passed instead.
- Local build/browser evidence does not establish CI-provider, deployment, or
  production behavior; those operations were outside authorization.

## Delivery status and next step

- Four committed work units total 1,493 authored additions plus deletions.
- Generated lock change is 272 additions plus deletions and remains separate.
- This closure-document change is separate from both totals.
- No size exception is authorized for the future hard 400-line PR limit.
  PF-01's toolchain-only subdivision was not independently green, and PF-03's
  proposed subdivision was not proved green. Any future publication needs
  genuinely green review slices or explicit maintainer approval.
- No push, pull request, merge, publication, or deployment has occurred. The
  next step is a separate user-authorized delivery decision.
