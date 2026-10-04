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

- [x] PF-02 — Correct production URLs, sitemap and robots.
      Use a stable sgmr.dev origin; list real routes only; omit artificial
      lastmod; retain crawler rules while correcting the sitemap location.
      Proposed files: astro.config.ts, src/pages/sitemap.xml.ts, public/robots.txt
      or its generated replacement, src/lib/site.ts and its tests.
      Route: delegated; shared URL invariant and multiple consumers.
      Rollback: revert only canonical/discovery behavior and regression tests.

- [x] PF-03 — Synchronize client language and document metadata.
      Preserve bilingual UI and one URL. Update title, description, social
      metadata and JSON-LD on ES/EN selection and persisted-language reload.
      Remove nonexistent SearchAction and unsupported same-URL alternates.
      Proposed files: SEO/base/toggle components, a shared language client with
      DOM tests, index and both existing TOS pages as needed.
      Route: delegated; cross-component state and metadata behavior.
      Rollback: revert only locale synchronization and associated tests.

- [x] PF-04 — Honor reduced motion for all current animations.
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

The initial PF-01 checkpoint was not closed because full gates exposed source
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

PF-01 closed after independent verification and a parent focused-test spot
check: all frozen-install, formatting, type, test and build gates pass.
Commit: fe680dcfce82170f961f938223a7f5e7100d93cd.
Risk: unassessable/high; independent verifier passed, RDD disabled/unmanaged.
Authored slice: 408 lines; generated lock: 272 lines separately. Keep this
coherent green unit rather than split into a red intermediate toolchain-only
commit. The eight-line advisory overage is recorded honestly; a future PR
requires an approved size exception or a genuinely green subdivision, neither
is authorized by this local commit. Running authored count: 408.
Next: implement PF-02 with observed TDD; PF-03 and PF-04 remain untouched.

PF-02 candidate implemented locally without a commit. The focused site test
first failed 3/3 assertions against the CI-dependent site URL, missing shared
site helper and stale robots host, then passed 3/3 after the production origin,
route inventory, sitemap rendering and robots discovery URL were aligned.
`bun run format:check`, `bun run check` (16 files, zero diagnostics), the full
Vitest suite (2 files, 5 tests) and `bun run build` pass. With `CI` unset, the
built sitemap contains only `/`, `/acezone/tos/` and `/wattly/tos/`, omits fake
modification dates, and exposes no localhost, `/work` or stale Vercel domain.
Built canonicals resolve to `https://sgmr.dev/`,
`https://sgmr.dev/acezone/tos/` and `https://sgmr.dev/wattly/tos/`; the copied
robots file points to `https://sgmr.dev/sitemap.xml` with crawler rules
preserved. PF-02 remains unchecked pending independent verification and the
parent commit. PF-03 and PF-04 remain untouched.

The independent PF-02 verifier found that the sitemap's two TOS URLs omitted
the trailing slash used by their generated canonicals. A corrected focused
assertion first failed 1/3 tests against the mismatched route inventory, then
passed 3/3 after both TOS sitemap paths were canonicalized with trailing
slashes. The final built sitemap URLs now equal the three generated page
canonicals exactly. PF-02 remains unchecked pending parent verification and
commit.

PF-02 closed after independent correction verification and parent3-test spot
check. Commit: e3eb31ec0884165c82910323db3b6fb7d8493197.
Risk: unassessable/high; independent verifier passed, RDD disabled/unmanaged.
Actual commit snapshot: 140 authored lines including prior closure evidence;
no lock changes. Running authored commit count: 548.
Next: implement PF-03 with observed DOM regression RED/GREEN.

PF-03 candidate implemented locally without a commit. The new Happy DOM suite
first failed 4/4 tests against the missing synchronized client behavior and
unsafe raw script serialization, then passed 6/6 after wiring the real homepage,
AceZone and Wattly metadata through one typed language client. Saved-language
restore, ES→EN→ES controls, invalid and blocked storage, visible content,
document metadata and localized JSON-LD are covered. Custom Person identity and
social URLs remain intact; the TOS schemas retain their site and author URLs.
The unsupported SearchAction and same-URL hreflang links are absent, and the
legacy language service is no longer mounted. Formatting, Astro check (18
files, zero diagnostics), the full Vitest suite (3 files, 11 tests), build and
diff checks pass. Built output contains the localized payload, Spanish initial
SEO, stable sgmr.dev canonicals and one Vercel Analytics loader per page. No
real-browser smoke was run in this worker; parent integration readback remains
pending. PF-03 stays unchecked until independent verification and commit.

PF-03 closed after independent source, DOM and real Edge verification, then
mechanical import normalization and all final gates; parent6-test spot passed.
Commit: ab8d87fe633cc25003710317e3ef63f47d0a1c27.
Risk: unassessable/high; independent verification passed; RDD disabled/unmanaged.
Actual commit snapshot: 823 authored lines including prior closure evidence.
Running authored commit count: 1371. Preserve meaningful behavior and tests;
future PR publication must use verified green slices or an explicit approved
size exception. Current proposal is not proved independently green and is not
publication authorization. No remote actions were performed.
Next: implement PF-04 with RED/GREEN and final local browser motion checks.

PF-04 candidate implemented locally without a commit. The focused regression
first failed 1/2 tests because the reduced-motion rule selected observer-driven
elements but none of the six direct hero or pulse animation classes. It passed
2/2 after one preference-scoped selector covered both mechanisms while keeping
the existing `animation`, `opacity` and `transform` important overrides. The
rule remains after the animation package import, so imported utilities cannot
restore motion through ordinary cascade order. Formatting, Astro check, the
full test suite, build and diff checks pass. Built CSS retains normal animation
rules outside the media query and applies the reduced-motion override to direct
hero animation classes and `animate-ping`. Real browser preference emulation is
pending parent verification; PF-04 remains unchecked until verification and
commit.
