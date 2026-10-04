# Integrate portfolio modernization onto current main

## Outcome first

Retain the ancestry of all twelve commits ending at
`5ce09c867b9abaa6b51ee98c1d4bed16eadd2132` through a normal merge onto the
newer `origin/main` baseline
`477dc7af55161c3c351641849f507a139aafd8fe`. Preserve the remote Tech Lead,
mobile-first design and its five newer commits while adapting the verified
Wattly, TVRadar, and Duellum project records and genuine screenshots to the
current data and section architecture.

This document is recovery state. INT-01 is complete at merge commit
`05ff55eb2573d5a253d98bdf231d3b1748c06877`, with parents `477dc7a` and
`5ce09c8`; its writer checks are recorded below. Those checks are not the
independent verification required by VAL-01 and are not production proof.
Remote operations and PUB-01 remain outside this worker phase.

## Why this exists

The local modernization line and `origin/main` diverged at
`3c531346c451884b7a2fe7d246ba313b10a6ba39`. The local line contains twelve
reviewable commits, but current main contains a newer professional-profile
model, section components, AVIF-oriented asset pipeline, CVs, output verifier,
mobile Lighthouse budgets, and deferred language service. Publishing either
side wholesale would discard valid work. The integration must preserve both
histories and reconcile behavior deliberately.

## Authorized scope and channels

| Item | Authorized boundary |
| --- | --- |
| Writable worktree | `/Users/sergiogmr/portfolio-worktrees/main-integration-20261004` |
| Working branch | `fix/portfolio-main-integration-20261004` |
| Target baseline | `origin/main` at `477dc7af55161c3c351641849f507a139aafd8fe` |
| Source lineage | `feat/portfolio-modernization-20261004` ending at `5ce09c867b9abaa6b51ee98c1d4bed16eadd2132` |
| Read-only original checkout | `/Volumes/Develop/Astro/portfolio`; do not modify or treat its unrelated dirt as candidate content |
| Remote | `origin` = `git@github.com:SergioGMR/portfolio.git` |
| Later remote operation | Normal SSH freshness check and push through `main`, only after the exact integrated SHA passes every required gate |
| Explicit exclusions | No force push, rebase, squash, cherry-pick replacement, history rewrite, rules bypass, GitHub API/`gh`, manual deployment, credential discovery, or unrelated cleanup |

The current phase authorizes INT-01 in the isolated worktree plus its recovery
artifact and Engram mirror. Remote operations are forbidden in this phase.

## Design read

Reading this as a preservation integration for technical hiring audiences:
keep the current mobile-first Tech Lead portfolio, blue/neutral tech language,
section composition, responsive behavior, content order, and interaction model.
This is not a redesign. New project content must fit the current system rather
than restore the older page implementation.

## Integration map

### Histories that must remain ancestors

- Local-only commits, oldest first: `fe680dc`, `e3eb31e`, `ab8d87f`,
  `41a2404`, `1e4d934`, `a2587ac`, `002f551`, `26dab11`, `c442bdb`,
  `36d7b93`, `f67077a`, `5ce09c8`.
- Remote-only commits, oldest first: `c79b969`, `8d3006f`, `2d49302`,
  `1e380fc`, `477dc7a`.
- Required integration shape: a normal merge commit whose history contains
  both `5ce09c8` and `477dc7a`; never synthesize equivalent content while
  dropping either ancestry.

### Textual conflicts predicted by the three-way merge

| Area | Conflicting paths | Preservation rule |
| --- | --- | --- |
| Toolchain | `astro.config.ts`, `package.json`, `bun.lock`, `tsconfig.json` | Keep the current output/Lighthouse dependencies and Bun-native tests while adopting the compatible Astro 7 graph, frozen Bun install, `moduleResolution: "bundler"`, and check-only scripts. Regenerate the lock only from the reconciled manifest. |
| SEO and locale | `src/components/HeadSEO.astro`, `src/components/layout/BasePage.astro`, `src/components/layout/PageShell.astro`, `src/components/LanguageToggleLite.astro`, `src/pages/acezone/tos.astro`, `src/pages/wattly/tos.astro`, `src/pages/sitemap.xml.ts` | Keep current Tech Lead metadata, `sgmr.dev`, CV/output invariants, section shell, and the deferred `LanguageService`; add synchronized ES/EN document metadata and retain the real route-only sitemap without fake dates. |
| UI and accessibility | `src/components/ThemeToggleLite.astro`, `src/pages/index.astro`, `src/styles/globals.css` | Keep the current mobile-first sections, tokens, responsive order, theme controls, and content; carry forward only compatible reduced-motion/focus behavior. Do not restore the superseded monolithic page. |
| Content compatibility | `src/lib/constants.ts` | Keep current constants and `PROFESSIONAL_PROFILE` architecture. Adapt the three verified showcase records into that model without inventing employment, metrics, responsibilities, results, or technology claims. |

`src/pages/404.astro` changed on both sides but the dry three-way analysis did
not predict a textual conflict. It still requires semantic readback.

### Non-conflicting local paths that would land automatically

- Workflow and discovery: `.github/workflows/autofix.yml`,
  `public/robots.txt`, `src/lib/site.ts`.
- Locale/metadata helpers: `src/lib/language-client.ts`,
  `src/lib/page-metadata.ts`.
- Regression suites: `tests/interface.test.ts`,
  `tests/language-client.test.ts`, `tests/projects.test.ts`,
  `tests/reduced-motion.test.ts`, `tests/site.test.ts`,
  `tests/toolchain.test.ts`.
- Historical ODD records: `odd/tasks/portfolio-modernization.md`,
  `odd/tasks/portfolio-projects.md`, `odd/tasks/portfolio-review-fixes.md`.
- Genuine captures: `public/projects/wattly.webp`,
  `public/projects/tvradar.webp`, `public/projects/duellum.webp`.

These paths are not automatically correct merely because Git can apply them.
The helpers and tests must be reconciled with the current architecture. The
historical task/audit records stay source-only evidence from earlier bytes;
they are not a security certification or proof for this integration.

### Content adaptation

- Preserve the existing project order and records exactly: JauntJar, Todo-Lux,
  Basuraleza, Solutec.
- Append Wattly, TVRadar, and Duellum in that order, using their existing
  verified HTTPS destinations, ES/EN category and summary text, and genuine
  900x480 screenshots.
- Use the current `ProjectsSection.astro` card language and image pipeline.
  Prefer a truthful showcase variant with category/summary fields over filling
  current case-study fields with invented responsibility, result, metrics,
  employment links, or stack claims.
- Preserve the source captures' content. They may move under `src/assets` for
  the current Astro image pipeline; generated output format does not make a
  different screenshot genuine.
- Keep the deferred language-service placement after primary page content.

## TDD and effective runner

Strict TDD is enabled by the supplied repository `AGENTS.md`. The current main
test runner is Bun's native runner (`bun test`) and its existing tests import
from `bun:test`. Reconciliation will keep that runner and adapt the incoming
Vitest-style tests instead of adding a second test framework.

Expected reconciled scripts:

| Script | Exact command |
| --- | --- |
| `test` | `bun test` |
| `check` | `astro check` |
| `format:check` | `prettier --check "src/**/*.{astro,ts,css}" "scripts/**/*.ts" "tests/**/*.ts" "package.json" "astro.config.ts" ".lighthouserc.cjs" ".github/workflows/*.yml" --cache` |
| `build` | `astro build && bun run verify:output` |
| `verify:output` | `bun scripts/verify-portfolio-output.ts` |
| `lighthouse:ci` | `bun run build && lhci autorun` |

For implementation, record an observed RED from new/adapted integration tests
before resolving the behavior, then GREEN and REFACTOR. Earlier green evidence
belongs to different bytes and cannot be reused.

## Work plan

- [x] **MAP-01 — Map lineage, conflicts, current architecture, gates, and
  recovery boundaries.**
  - Route: delegated direct (`odd-worker`).
  - Trigger evidence: the map required history plus more than four source,
    configuration, CI, test, and document paths.
  - Observed outcome: merge base, twelve local commits, five remote commits,
    fifteen predicted textual-conflict paths, one clean overlapping path,
    current Bun/output/Lighthouse gates, and the uncontested delta were
    inventoried without starting a merge or remote operation.
- [x] **INT-01 — Merge the complete local lineage and reconcile one coherent
  integration candidate.**
  - Route: delegated direct (`odd-worker`).
  - Trigger evidence: a normal ancestry-preserving merge plus coordinated
    changes across package/lock/CI, SEO, localization, accessibility, content,
    images, sections, and regression tests.
  - Observed outcome: a normal merge resolved all fifteen predicted conflicts,
    retained the current main design/model/CVs/output/performance/deferred
    language service, and adapted the three verified showcase projects without
    unsupported case-study claims. The Conventional merge commit is
    `05ff55eb2573d5a253d98bdf231d3b1748c06877`; its parents are
    `477dc7af55161c3c351641849f507a139aafd8fe` and
    `5ce09c867b9abaa6b51ee98c1d4bed16eadd2132`.
  - TDD evidence: on the untouched remote baseline, the new integration suite
    was RED with 0 passing and 2 failing tests because the expected seven
    project IDs and showcase rendering/image contracts were absent. After
    reconciliation it was GREEN inside the full suite. The required targeted
    run passed 60 tests with 404 expectations; the full run passed 67 tests
    with 450 expectations. No test failed.
  - Writer checks: `bun ci`, `bun run format:check`, `bun run check` (36 files,
    zero errors/warnings/hints), the targeted tests, `bun run test`, `bun run
    build`, and `bun run verify:output` passed under Node 24.19.0 and Bun 1.4.2.
    Five mobile Lighthouse runs passed every error-level assertion with 100 in
    performance, accessibility, best practices, and SEO; LCP produced the
    configured warning at a 1432.2615 ms median against the 1200 ms warning
    budget. `git diff --check` and both ancestry checks passed.
- [ ] **VAL-01 — Validate the exact merge candidate and record proof.**
  - Route: delegated verification (`odd-verify`) after writer self-checks.
  - Trigger evidence: build/output invariants, Lighthouse browser dependency,
    bilingual responsive UI, binary assets, and ancestry need independent
    evidence.
  - Run every command below on the exact candidate. Inspect ES/EN, light/dark,
    mobile/desktop, all seven project cards, reduced motion, metadata changes,
    and current output invariants. Record failures, unavailable checks, and
    environment limitations honestly; integration proof cannot be borrowed.
- [ ] **PUB-01 — Publish the same validated SHA through the authorized SSH
  channel.**
  - Route: parent-controlled remote delivery; no worker may expand it.
  - Trigger evidence: remote freshness and branch-protection state are external
    to local implementation.
  - Fetch only when publication begins, verify `origin/main` has not moved,
    and push without force. If it moved, stop and reconcile/validate the new
    candidate. Do not use `gh`, an API credential, or manual deployment.

## Acceptance criteria

- `git merge-base --is-ancestor 5ce09c867b9abaa6b51ee98c1d4bed16eadd2132 HEAD`
  and `git merge-base --is-ancestor 477dc7af55161c3c351641849f507a139aafd8fe HEAD`
  both succeed on the final candidate.
- A real merge commit preserves both lines; no force, rebase, squash,
  replacement cherry-pick, or bypass is used.
- Current main's Tech Lead profile, existing four project records and order,
  mobile-first section UI, AVIF-oriented assets/CVs, output verifier,
  Lighthouse configuration, and deferred language service remain intact.
- Wattly, TVRadar, and Duellum follow the four existing projects with the
  verified URLs, bilingual category/summary records, and genuine screenshots.
- No unsupported employment link, responsibility, result, metric, or
  technology stack is introduced for those three projects.
- Canonical, Open Graph, sitemap, robots, and live ES/EN document metadata all
  resolve consistently to the current production origin.
- Reduced-motion behavior disables direct/reveal motion without hiding content.
- CI uses Bun 1.4.2 with `bun ci` and runs check-only formatting, Astro checks,
  Bun tests, and the production build/output verifier in dependency order.
- Historical audit/task documents are retained as prior source evidence only;
  neither they nor this plan claim current security or production validation.
- The original `/Volumes/Develop/Astro/portfolio` checkout and its unrelated
  dirt remain byte-for-byte untouched by this integration.

## Verification commands

Run on the reconciled candidate, in this order, and record exact outcomes:

```bash
bun ci
bun run format:check
bun run check
bun test src/lib/professional-profile.test.ts \
  scripts/verify-portfolio-output.test.ts tests/projects.test.ts \
  tests/language-client.test.ts tests/reduced-motion.test.ts \
  tests/site.test.ts tests/toolchain.test.ts
bun run test
bun run build
bun run verify:output
bun run lighthouse:ci
git diff --check 477dc7af55161c3c351641849f507a139aafd8fe...HEAD
git merge-base --is-ancestor 5ce09c867b9abaa6b51ee98c1d4bed16eadd2132 HEAD
git merge-base --is-ancestor 477dc7af55161c3c351641849f507a139aafd8fe HEAD
```

`bun run build` already invokes `verify:output`; the explicit verifier command
is retained as a named gate/readback. Lighthouse is a separate performance
gate and needs an available Chromium/Chrome runtime. Visual proof uses the
local preview only after build, across 390px and desktop widths, ES/EN,
light/dark, and reduced-motion states; it does not establish production proof.

## Environment and dependency notes

- Writer validation used Bun `1.4.2`, Git `2.50.1`, and the existing fnm Node
  `v24.19.0` executable at
  `/Users/sergiogmr/.local/share/fnm/node-versions/v24.19.0/installation/bin/node`.
- Current main already declares `@lhci/cli`, `sharp`, Space Grotesk, and the
  Astro/Tailwind/Vercel stack. No new UI or image dependency is planned.
- Reconcile to one compatible Astro 7 dependency graph while retaining
  `@fontsource/space-grotesk` and `@lhci/cli`; do not force incompatible latest
  versions. The lockfile is generated output and must come only from the final
  manifest via Bun 1.4.2.
- Lighthouse used the existing Microsoft Edge `154.0.4258.53` executable at
  `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`. Automatic
  browser discovery initially failed; the explicit compatible executable then
  completed all five runs. No browser or host runtime was installed.

## Forecast and delivery decision

The uncontested local delta alone is **1,576 authored changed lines** (1,561
additions and 15 deletions), excluding binary screenshots and the generated
lockfile. It includes 627 lines of historical ODD records, six incoming test
files, workflow/discovery changes, and locale/metadata helpers. Conflict
reconciliation plus this recovery document makes the realistic final range
approximately **1,750-2,200 authored changed lines** from current remote main.

Delivery strategy is `exception-ok`. The user explicitly approved the
maintainer `size:exception` for this one coherent ancestry-preserving
integration after reviewing the approximately **1,750-2,200 authored-line**
forecast. The reconciled merge contains **3,227 authored changed lines** from
current remote main (2,519 additions and 708 deletions), excluding the
generated lockfile and binary screenshots. The higher actual count includes
the preserved historical ODD records, adapted regression suites, and necessary
current-main formatting under the reconciled Prettier graph; none is generated
padding. One honest slicing pass found no sub-400 merge slice that can both
retain all twelve commits through one normal merge and present a coherent
buildable candidate. Artificial file-type splits, history rewriting, or
omitting tests/docs remain unacceptable.

## Rollback boundary

- Before the merge commit: `git merge --abort` returns this isolated branch to
  the recorded `477dc7a` baseline.
- After a local or published merge commit: use a normal corrective/revert commit
  scoped to the merge (`git revert -m 1 <merge-sha>` after reviewing the exact
  candidate); never rewrite or force-update shared history.
- The rollback covers only the integration branch/result. It must never alter
  the original feature checkout or its unrelated dirt.

## Current evidence and next step

- Worktree `fix/portfolio-main-integration-20261004` contains the two-parent
  merge `05ff55eb2573d5a253d98bdf231d3b1748c06877`. Both required ancestry checks
  and the post-commit diff check passed.
- The source candidate was validated before this passive evidence update. This
  follow-up changes only this recovery document; source bytes remain identical
  to the validated merge commit.
- CodeGraph was initialized independently in this worktree; no index was copied
  or linked from the original checkout.
- No fetch, push, GitHub API call, credential discovery, remote file transfer,
  or deployment was performed.
- Next: parent runs VAL-01 against the final exact SHA, including independent
  responsive ES/EN, light/dark, reduced-motion, seven-project, and metadata
  inspection. PUB-01 may proceed only after that exact candidate is green and
  remote freshness is re-established through the authorized SSH channel.
