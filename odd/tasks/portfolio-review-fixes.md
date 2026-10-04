# Fix the portfolio review findings

Keep Astro 6 and correct the four verified CI, SEO, locale-metadata and
reduced-motion findings without redesigning the site.

## Scope and authorization

- User: "Astro 6 es el bueno, soluciona todo".
- Local Bun dependencies, including Vitest and @astrojs/check: approved.
- Preserve the existing single-URL language selector and visual design.
- No push, PR creation, merge, publication, deployment or provider mutation.
- Preserve unrelated dirty .atl/skill-registry.md, .gitignore, .mcp.json,
  CLAUDE.md, .atl/.skill-registry.cache.json and CLAUDE.md.backup.
- Base: main at 3c531346c451884b7a2fe7d246ba313b10a6ba39.
- Work branch: fix/portfolio-review-20261004.

## Why

CI uses pnpm without its lockfile; production URLs depend on CI; the language
selector leaves document metadata stale; reduced-motion protection omits
direct animations. The code already uses Astro 6.0.8, which is intentional.

## Execution and delivery

- Route: delegated direct for every task.
- Trigger: broad preparatory reading and multiple non-trivial files.
- Single writer; no parallel source writers.
- Strict TDD: enabled by the supplied AGENTS.md instructions.
- Runner to establish: `bun run test` -> `vitest run`.
- Observe RED before each behavior fix, then GREEN and REFACTOR.
- RDD: globally off, observed with read-only mode status; do not enable it.
- Ordinary native risk assessment and proportional independent verification.
- Forecast: 650-780 authored additions plus deletions, excluding generated lock.
- Delivery strategy: ask-on-risk. Chain strategy: feature-branch-chain.
- User selected option 1 explicitly; no remote delivery is authorized.
- Planned local slices: PF-01, PF-02, PF-03, PF-04, in dependency order.
- Each slice targets at most 400 authored changed lines; verify actual counts.
- Running authored count and exact slice commit boundaries: pending.
- Commits: selective Conventional Commits per green work unit, no AI attribution.

## Tasks

- [x] PF-01 — Standardize Bun and establish CI checks.
      Align the Bun pin with text-lock support; add Vitest, Astro check and DOM
      test support; run frozen installation, check-only formatting, types, tests
      and build in CI. Preserve Astro 6. Proposed files: package.json, bun.lock,
      .github/workflows/autofix.yml, focused toolchain regression test.
      Route: delegated; multi-file configuration and test setup.
      Rollback: remove only toolchain/check changes and associated tests.
      Required gate remediation: fix the observed strict typing errors in
      LanguageToggleLite, ThemeToggleLite and BasePage without changing UI
      semantics or suppressing diagnostics; normalize the two clean-at-base
      PageShell and Wattly TOS source files. These are necessary to make the
      newly established CI checks usable, not a redesign or scope expansion.

- [ ] PF-02 — Correct production URLs, sitemap and robots.
      Use a stable sgmr.dev origin; list real routes only; omit artificial
      lastmod; retain crawler rules while correcting the sitemap location.
      Proposed files: astro.config.ts, src/pages/sitemap.xml.ts, public/robots.txt
      or its generated replacement, src/lib/site.ts and its tests.
      Route: delegated; shared URL invariant and multiple consumers.
      Rollback: revert only canonical/discovery behavior and regression tests.

- [ ] PF-03 — Synchronize client language and document metadata.
      Preserve bilingual UI and one URL. Update title, description, social
      metadata and JSON-LD on ES/EN selection and persisted-language reload.
      Remove nonexistent SearchAction and unsupported same-URL alternates.
      Proposed files: SEO/base/toggle components, a shared language client with
      DOM tests, index and both existing TOS pages as needed.
      Route: delegated; cross-component state and metadata behavior.
      Rollback: revert only locale synchronization and associated tests.

- [ ] PF-04 — Honor reduced motion for all current animations.
      Extend the existing preference rule to direct animate classes and ping.
      Proposed files: src/styles/globals.css and a focused regression test.
      Route: delegated; stylesheet behavior and regression proof.
      Rollback: revert only reduced-motion coverage and its test.

## Acceptance and checks

Each task records actual RED/GREEN evidence, full applicable check results,
file inventory, authored count, risk tier, commit identity and rollback scope.
No checkbox closes on source inspection alone.

Final local commands: `bun ci`, `bun run format:check`, `bun run check`,
`bun run test`, `bun run build`. Normalize owned files only, before checks.
Unrelated dirty files may expose a pre-existing formatting failure; do not
silently normalize or suppress them.

Local browser/output checks: ES/EN metadata and JSON-LD, saved-language reload,
sitemap and robots, reduced-motion hero and pulse. CI/provider/production proof
remains separate and unauthorized. Independent verification and one parent
spot-check remain required according to native risk.

## Progress

Preparation completed read-only by the delegated writer; no source edits or
dependency installation yet. Four-task document created before first source
write. Engram mirror: odd/portfolio-review-fixes/tasks.

PF-01 candidate implemented locally without a commit. The focused toolchain
test first failed 2/2 assertions against Bun 1.1.33 and the pnpm workflow, then
passed 2/2 after aligning Bun 1.4.2, installing the exact test/check tools and
adding frozen CI gates. `bun ci`, focused/full Vitest and `bun run build` pass.
Runtime harness: N/A; PF-01 is configuration-only and the production build is
its local applicability proof.

PF-01 is not closed because the new full gates exposed pre-existing source
failures outside this slice. `bun run format:check` reports unchanged
`PageShell.astro` and `wattly/tos.astro`; both fail identically from `HEAD`.
`bun run check` reports 15 errors in unchanged files: 7 in
`LanguageToggleLite.astro`, 7 in `ThemeToggleLite.astro`, and 1 invalid
`Analytics` component in `BasePage.astro`. No source diagnostics were
suppressed or repaired in PF-01. Owned files pass focused Prettier validation.

Parent scoped the baseline gate remediation above. Native assessment was
unassessable/high because of pre-existing and candidate untracked files;
RDD remains off. An independent verifier is required after gates are green.

The PF-01 remediation now passes every required local gate. Language and theme
controls use guarded unions and typed DOM queries while preserving their
fallbacks, including the light theme default. Vercel Analytics remains enabled
through the supported adapter integration; the duplicate component and direct
dependency were removed, and the built page still contains the insights script.
The two clean-at-base formatting failures were normalized mechanically.

The full prospective PF-01 snapshot exceeds 400 authored changed lines only
after including this complete task document. Keep review boundaries honest:
PF-01A holds the Bun/CI/test harness plus this document; PF-01B holds the typed
gate remediation and mechanical formatting. Both remain uncommitted pending
the independent verifier and parent closure. PF-02 remains untouched.
