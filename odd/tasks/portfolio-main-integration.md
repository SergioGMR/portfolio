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
`5ce09c8`. VAL-01 independently verified exact candidate
`f3099161745b2f8ab04c8456a572d6b1547acb4d`; its evidence is recorded below.
That local proof is not production proof. PUB-01 remains pending and remote
publication authority stays with the parent. The parent has atomically pushed
the feature branch and `dev` to
`278baef2968f0873c78f101dbcdb50e98171645f`; fresh remote evidence still places
`main` at `477dc7af55161c3c351641849f507a139aafd8fe`. Main promotion is stopped on
the dependency-audit gate. Authorized SEC-01 has removed every production
advisory but remains partial on six tooling incidences; VAL-02 and PUB-01 stay
pending.

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
| Parent remote evidence | Normal SSH push confirmed both `fix/portfolio-main-integration-20261004` and `dev` at `278baef2968f0873c78f101dbcdb50e98171645f`; freshly verified `main` remains `477dc7af55161c3c351641849f507a139aafd8fe` |
| Remaining remote operation | Main promotion only after explicit dependency-remediation approval, a clean audit disposition, and all functional gates on the resulting exact candidate |
| Explicit exclusions | No force push, rebase, squash, cherry-pick replacement, history rewrite, rules bypass, GitHub API/`gh`, manual deployment, credential discovery, or unrelated cleanup |

INT-01 and VAL-01 are complete in the isolated worktree. The parent completed
the authorized feature/dev SSH publication; this worker performed no remote
operation. User consent recorded in Engram observations 22293 and 22305
authorizes compatible local dependency remediation, necessary local install/lock
regeneration, regression tests, and all functional checks before main. The
configured 5.6 worker never executed because of capacity; the user authorized
`gpt-6.1-sol` for the writer and independent verifier. No worker remote operation
is authorized; UI/assets/CVs/routes/locale redesign remains excluded.

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
- [x] **VAL-01 — Validate the exact merge candidate and record proof.**
  - Route: delegated verification (`odd-verify`) after writer self-checks.
  - Trigger evidence: build/output invariants, Lighthouse browser dependency,
    bilingual responsive UI, binary assets, and ancestry need independent
    evidence.
  - Independent command evidence on exact `f309916`: `bun ci`, format check,
    Astro check (zero diagnostics), targeted tests (60 pass, 0 fail, 404
    expectations), full tests (67 pass, 0 fail, 450 expectations), four-page
    build with 37 optimized images, output verification, diff check, and both
    ancestry checks passed under Node 24.19.0 and Bun 1.4.2. The parent spot
    check repeated `bun run test` with the same 67/0 result.
  - Five independent mobile Lighthouse runs scored 100 for performance,
    accessibility, best practices, and SEO in every run. All error-level
    assertions passed. Median LCP was 1431.06915 ms against the unchanged 1200
    ms warning budget.
  - Browser evidence covered eight combinations: 1440/390 widths, ES/EN, and
    light/dark. Each showed seven cards with seven loaded images, card bounds
    inside the viewport, no horizontal overflow, inactive locale content
    hidden, and live description/`og:locale` changes (`es_ES`/`en_US`).
  - Actual DevTools reduced-motion emulation returned `matchMedia: true`; all
    26 animated nodes had opacity 1, no transform, zero-second animation,
    0.00001-second transition, and automatic scroll behavior. Emulation was
    reset and verified false, DevTools and the owned browser tab were closed,
    and the exact-command preview process was stopped with no owned process
    remaining.
  - The current case-study/showcase union, original four-project order, three
    truthful showcase records, current design/CVs/profile/output/performance
    behavior, clean source, and both ancestries were confirmed. Hashes for the
    original checkout's six protected dirty files remained unchanged.
  - Exact remote `dev` candidate `278baef` received a second independent full
    validation: `bun ci`, format check, Astro check across 36 files with zero
    diagnostics, targeted tests (60/0, 404 expectations), full tests (67/0,
    450 expectations), four-page build with 37 optimized images, output
    verification, diff check, and both ancestry checks passed. Five mobile
    Lighthouse runs again scored 100 in all four categories with TBT 0 and CLS
    0; median LCP was 1431.6771 ms against the unchanged warning-only 1200 ms
    budget. Validation processes were cleaned up.
- [ ] **SEC-01 — Remediate known dependency advisories compatibly.**
  - Route: delegated direct (`odd-worker`, user-authorized `gpt-6.1-sol/high`).
  - Trigger evidence: manifest/lock, blocked parent ranges, regression tests,
    and CI audit contract require coordinated non-trivial changes.
  - Scope: prefer published compatible patch/minor refreshes; only proven
    compatible narrow overrides; no audit ignores or incompatible major force.
  - Checks: Bun-native regression RED before behavior change, then GREEN;
    frozen install, zero-incidence full/production audits, all functional gates.
  - Partial outcome: 41 of 47 baseline incidences resolved, including all 28
    production incidences and the critical `tar` issue. Full audit remains red
    on six LHCI incidences; this task is intentionally unchecked.
  - TDD: compatible floors RED 4 pass/8 fail -> GREEN 12/0; actual Vercel
    resolution/matching/rewrite/compile RED 17/1 -> GREEN 18/0; actual Express
    and body-parser query resolution/parsing RED 20/2 -> GREEN 22/0.
  - No direct dependency version changed. One exact parent/version-scoped
    override patches only `@vercel/routing-utils@6.6.0`'s `path-to-regexp`;
    Express's separate 0.1 parser remains 0.1.13.
  - Writer checks on the normalized final source: `bun ci`, `format:check`,
    Astro check (36 files, zero diagnostics), targeted tests (78/0, 444
    expectations), full tests (85/0, 490 expectations), four-page build with
    37 optimized images, and explicit output verification all exited 0.
    Production audit exited 0 across 372 packages; full audit exited 1 with
    4 high, 1 moderate, and 1 low incidence. Final Lighthouse/commit evidence
    is recorded in the remediation disposition below.
- [ ] **VAL-02 — Independently verify the exact remediated candidate.**
  - Route: delegated verification (`odd-verify`), launched by the parent after
    SEC-01 self-verification.
  - Trigger evidence: changed toolchain requires fresh install/audit/build,
    output/performance, preserved UI, and ancestry proof on exact new bytes.
  - Progress: pending; earlier VAL-01 does not certify the changed graph.
- [ ] **PUB-01 — Publish the same validated SHA through the authorized SSH
  channel.**
  - Route: parent-controlled remote delivery; no worker may expand it.
  - Trigger evidence: remote freshness and branch-protection state are external
    to local implementation.
  - Partial outcome: the parent used the authorized normal SSH channel to push
    both `fix/portfolio-main-integration-20261004` and `dev` atomically to
    `278baef2968f0873c78f101dbcdb50e98171645f`. A fresh check showed `main`
    still at `477dc7af55161c3c351641849f507a139aafd8fe`; no remote dev/reference
    branch existed before this publication.
  - Main promotion is not authorized while the dependency-audit gate below is
    unresolved. Keep this task unchecked until a remediated exact candidate
    passes audit disposition plus every functional gate and the main push is
    confirmed. Do not use force, `gh`, an API credential, or manual deployment.

## Dependency-audit gate before main

The GitHub push warning triggered a focused read-only dependency check. It does
not prove that the static website is exploitable, and static output does not
remove build/tooling exposure. Remote GitHub reported two alert identities, but
their identities were not available and must not be inferred from local output.

| Evidence | Observed result |
| --- | --- |
| `bun audit` | 47 incidences: 1 critical, 25 high, 19 moderate, 2 low |
| `bun audit --prod` | 28 incidences: 1 critical, 15 high, 11 moderate, 1 low; independently reproduced by the parent |
| Critical package | `tar` 7.5.12; [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) affects versions through 7.5.18 and is patched in 7.5.19 |
| Other observed packages | `brace-expansion` 5.0.4, `devalue` 5.8.2, `http-cache-semantics` 4.2.0, `nanoid` 3.3.16, `path-to-regexp` 6.1.0, `picomatch`, and additional transitive occurrences |
| Dry-run only | `bun audit fix --dry-run` proposed 38 fixes and reported 9 occurrences blocked by parent dependency ranges; it installed or changed nothing |

The user subsequently authorized bounded compatible remediation (22293) and
the available writer/verifier model (22305). SEC-01 now owns the local correction;
VAL-02 requires fresh independent proof. The old counts above are baseline
evidence, not a disposition of the changed graph.


### Authorized remediation disposition (2026-10-05)

Source changes are limited to `package.json`, generated `bun.lock`, and
`tests/toolchain.test.ts`; this document is the only additional authored path.
No UI, assets, CVs, route configuration, locale behavior, or direct dependency
version was changed. No worker remote operation occurred.

| Transitive package | Baseline -> corrected |
| --- | --- |
| `brace-expansion` | 1.1.16 -> 1.1.21; 5.0.4 -> 5.0.12 |
| `devalue` | 5.8.2 -> 5.9.3 |
| `http-cache-semantics` | 4.2.0 -> 4.3.0 |
| `ip-address` | 10.3.1 -> 10.7.1 |
| `js-yaml` | 3.15.0 -> 3.15.2 |
| `nanoid` | 3.3.16 -> 3.3.18 |
| `picomatch` | 2.3.1 -> 2.3.2; 4.0.3 -> 4.0.4 |
| `tar` | 7.5.12 -> 7.5.21, beyond the later high advisory as well as the critical |
| `path-to-regexp` under Vercel only | 6.1.0 -> 6.3.0 |
| `express`, `body-parser`, `qs` | 4.22.2 -> 4.22.3; 1.20.6 -> 1.20.8; 6.15.3 -> 6.16.0 |

The first ten range-respecting refreshes came from
`bun audit fix --ignore-scripts --json` (38 resolved incidences). The published
compatible Express/body-parser patches admit `qs` ~6.16.0; targeted
`bun update express body-parser qs --ignore-scripts` fixed two more incidences
without adding a direct dependency or override. [Bun update documentation](https://bun.sh/docs/pm/cli/update)
confirms named transitive updates; [qs 6.16.0 changelog](https://raw.githubusercontent.com/ljharb/qs/v6.16.0/CHANGELOG.md)
records the relevant parser fixes. Real ordinary nested/array/encoded parsing
passed before and after the parent refresh.

The one override is scoped to `@vercel/routing-utils@6.6.0`'s direct
`path-to-regexp` dependency at 6.3.0, never to Express or all package instances.
The latest published Vercel parent still pins 6.1.0 and contains a parallel
6.3.0 comparison alias. The [6.3.0 release](https://github.com/pillarjs/path-to-regexp/releases/tag/v6.3.0)
is the maintained 6.x backtracking fix; its [versioned API](https://raw.githubusercontent.com/pillarjs/path-to-regexp/v6.3.0/Readme.md)
retains the `pathToRegexp` and `compile` signatures used by the
[Vercel implementation](https://raw.githubusercontent.com/vercel/vercel/main/packages/routing-utils/src/superstatic.ts).
Actual parent-scoped resolution, existing root/legal/assets matching, named
rewrite captures, and destination compilation pass after correction. The
[Bun override contract](https://bun.sh/docs/pm/overrides) supports this narrow
scope and produces `lockfileVersion: 3`; Bun 1.4.2 is pinned locally and in CI.
Older Bun versions cannot read this lock; provider/runtime proof remains a
separate parent-controlled delivery concern.

| Remaining tooling package | Boundary preventing ordinary compatible closure |
| --- | --- |
| `basic-ftp` 5.3.1 | Latest published 5.x remains 5.3.1; get-uri 6.0.5 requests ^5.0.2. Advisory requires 6.2.1; no forced major. |
| `extract-zip` 2.0.1 | Latest published release remains 2.0.1 and both advisories report no patch. LHCI -> lighthouse 12.6.1 -> puppeteer-core 24.43.1 -> browsers 2.13.2 requires it. Latest browsers 3.2.3 removes it, but crossing that exact major/API binding was not attempted. |
| `tmp` 0.1.0 / 0.0.33 | Latest releases on the requested branches remain unchanged; LHCI ^0.1.0 and external-editor ^0.0.33 do not admit patched 0.2.6. No unproven 0.x API override. |
| `uuid` 8.3.2 | Latest 8.x remains 8.3.2; LHCI ^8.3.1 does not admit patched 11.1.1. No forced major. |

The unpatched archive issues are [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3)
and [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv).
No exploit reproduction, fork, source patch, audit ignore, threshold reduction,
or tool removal was used. A zero-incidence full audit requires a new bounded
maintenance decision for this LHCI graph; green production audit alone does not
satisfy the required full gate. CI audit expansion is deferred rather than
adding a known-red full gate or silently substituting a weaker production-only
budget. Existing CI is unchanged.

Final writer Lighthouse ran five times with the unchanged configuration and
explicit existing Edge executable. Every run scored 100 for performance,
accessibility, best practices, and SEO, with TBT 0 and CLS 0. All error-level
assertions passed (exit 0). Median LCP 1431.75375 ms exceeded only the unchanged
1200 ms warning budget. The owned port 56067 had no listener after completion;
no browser/runtime was installed. This is local writer proof, not independent
VAL-02 or production/provider proof.

Source mutating normalization was limited to `package.json` and
`tests/toolchain.test.ts` before the final full command sequence. No byte changes
to these paths or the generated lock occurred after that verification.

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
bun audit
bun audit --prod
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

The external screenshot proof is
`/Users/sergiogmr/portfolio-project-captures/portfolio-main-integration-preview.jpg`.
It is a visually inspected 1200x1500 JPEG containing the complete Wattly,
TVRadar, and Duellum images, titles, categories, and summaries. SHA-256 is
`cc2a7eb0a972223043b61e600b23fc55bd054da0a4dad906f0b75bb291e1ae32`.
It was derived without pixel synthesis from the unchanged 2880x10116 raw
capture by extracting `{ left: 215, top: 4300, width: 1640, height: 2050 }`,
resizing to 1200 px wide, and encoding progressive JPEG quality 90 with 4:4:4
chroma subsampling through the existing Sharp dependency.

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
- Earlier VAL-01 evidence belongs to pre-remediation bytes. SEC-01 now changes
  the manifest/lock/regression suite and has its own fresh writer proof; VAL-02
  remains pending and must not reuse earlier source validation.
- CodeGraph was initialized independently in this worktree; no index was copied
  or linked from the original checkout.
- This worker performed no fetch, push, GitHub API call, credential discovery,
  remote file transfer, or deployment. Separately, the parent confirmed the
  authorized normal SSH feature/dev push described under PUB-01.
- VAL-01 is complete on exact `f3099161745b2f8ab04c8456a572d6b1547acb4d`.
  At its earlier passive closure, repository source remained byte-identical
  to that verified candidate. SEC-01 now requires its own exact-source proof.
- Remote feature and `dev` now point to verified `278baef`; freshly observed
  `main` remains `477dc7a`. PUB-01 remains unchecked because main promotion is
  stopped on the dependency-audit gate.
- Next: parent decides the bounded maintenance path for six unresolved LHCI
  incidences, with unpatched extract-zip the hard blocker. The production graph
  is clean, but main must remain stopped while full audit is red. Preserve the
  partial work unit, independently verify only as the parent routes it, and
  retain VAL-02/PUB-01 unchecked until their actual outcomes are observed.
- RDD is globally OFF per the parent's fresh read-only status. Do not invoke
  native review or change the user-owned mode during this remediation.
- Remediation forecast: approximately 100-200 additional authored lines plus
  generated lock changes; existing coherent-integration `exception-ok` remains.
  Rollback of this unit covers only its manifest/lock/test/CI and recovery edits,
  through a normal revert; unrelated integration history remains intact.
