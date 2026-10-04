# Portfolio project additions

## Objective and scope

Add Wattly, TVRadar, and Duellum to the portfolio with real public screenshots,
accurate bilingual descriptions, and the existing card design. Preserve all
four existing projects, routes, metadata, themes, accessibility, and motion.

User authorization covers local implementation, screenshot capture, checks,
and local ODD work-unit commits. No push, PR, merge, deployment, account changes,
private screenshots, new dependencies, or unrelated changes.

## Plan

- [ ] PRJ-01: Capture three anonymous public pages, export 900x480 WebP assets,
  add explicit bilingual project data and append three supporting cards, then
  verify the seven-card result and commit the cohesive work unit.

Route: delegated direct. Preparation and writer triggers apply because the
change requires coordinated data, rendering, assets, and regression tests.
Design: preserve existing blue/glass developer portfolio; no redesign.
Forecast: approximately 150-250 authored changed lines; generated image bytes
excluded. Delivery strategy: ask-on-risk. No remote delivery selected.

## Acceptance and verification

- Exact HTTPS URLs supplied by the user; three unique project records.
- Real screenshots with no browser chrome, private account data, or overlays.
- Non-empty ES/EN descriptions based only on inspected public pages.
- Seven working image cards; the existing first card remains lead.
- Desktop/mobile and light/dark layouts work in both locales.
- Strict TDD enabled by repository AGENTS instructions. Runner: Vitest via
  `bun run test`; observe RED before source implementation, GREEN, then refactor.
- Focused: `bun run test -- tests/projects.test.ts tests/interface.test.ts`.
- Normalize owned files only; broad `bun run format` would touch protected dirt.
- Full gates: `bun run format:check`, `bun run check`, `bun run test`,
  `bun run build`, and `git diff --check`.
- RDD is globally disabled; do not start or enable native review. Assess risk
  read-only to select proportional independent verification, if available.
- Parent spot-check and CUA local browser proof before delivery.

## Evidence and recovery

Baseline: `36d7b93272f3949554c285e7a92afbad6fc307d4` on
`feat/portfolio-modernization-20261004`.
Unrelated dirty paths and `.codegraph/` must be preserved. Authoritative baseline
hashes are retained outside the repo in the previous audit recovery folder.

Mapping and delegated implementation are complete; closure remains pending.
Three anonymous public captures were taken with Edge Web Capture on 2026-10-04.
Raw captures stay outside the repository. Optimized assets are genuine 900x480
WebP crops: Wattly 12,756 bytes, TVRadar 20,320 bytes, Duellum 17,584 bytes.

Observed writer TDD: focused RED had 4 failures and 5 passes; GREEN/refactor
passed 10 tests. Writer full gates passed format check, Astro check (zero
diagnostics), 25 tests, production build, and diff check. Built output has seven
cards, one lead, and six supporting.
Authored source/test delta is 214 lines (additions plus deletions).
Parent inspected all three raw and optimized screenshots and the two source
diffs. All captures are public, with no browser chrome or account data.

RDD remains globally off. Read-only native assessment was high/unassessable
because unrelated untracked inventory is undeclared; use independent ordinary
verification, not a native review or an inventory mutation.

Independent verification passed the same five full gates: format check,
Astro check (zero errors, warnings, or hints), 25/25 tests, build, and diff check.
Generated HTML has exact destinations, seven ES and seven EN blocks, and valid
image references. No candidate-caused blocking findings were reported.
Parent spot-check `bun run test` passed 25/25 on the final source bytes.

CUA browser proof passed eight ES/EN x light/dark x 390/1440 cases. All seven
images loaded, inactive locales stayed hidden, and no horizontal overflow or
out-of-bounds cards was found. Desktop and mobile screenshots were inspected.
Temporary viewport overrides and owned testing tabs were cleared. The owned
local preview was stopped; no localhost:4322 listener remains.
Final visual evidence stays outside the repository at
`/Users/sergiogmr/portfolio-project-captures/portfolio-projects-preview.jpg`.
It is a faithful 1400x1134 crop of the locally rendered final project rows.

Unavailable check: Lighthouse is not installed locally; no Lighthouse score,
assistive-technology, production runtime, or deployment result is claimed.
The six protected dirty paths still match their baseline hashes.
Rollback boundary: only the three new screenshot assets, project dataset,
card integration, associated regressions, and this recovery document.

Next: selective local work-unit commit and its identity record. No remote
delivery is authorized or required for this task.
