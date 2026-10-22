# PERF-01 — Lighthouse cold-start warm-up

## Objective

Stop the first of five CI Lighthouse runs from failing the
`categories:performance` budget because of a cold start. The rule from
`portfolio-content-refinement.md` still holds: do not drop measurements and
do not relax budgets.

## Evidence

- PR #3 CI run `39797978023`: run 1 scored performance 0.73, with TBT 1800 ms,
  FCP 1412 ms, 4.1 s of main-thread work and a 688 ms unattributable long task.
  Runs 2–5 scored 1 with TBT 0. LCP median 1437 ms.
- Earlier runs show the same pattern: `1b499ed` scored 89 on run 1 and run
  `38081876110` scored 85.
- Five local runs on macOS all score 1.
- Hypothesis: browser and runner cold start, not the site. Not proven.

## Authorization

2026-10-22: the user approved a separate PR for PERF-01 after the
recommendation (an unmeasured warm-up navigation). Merging this PR still needs
the user's confirmation.

## Decision

- Add an `options.warmUp(url, port)` step to `runMeasurements`: after the
  browser launches and before measured run 1, open the same URL once in the
  same Chrome through its DevTools endpoint, wait for load, and close the tab.
  It saves nothing, produces no report and does not count toward
  `numberOfRuns`.
- Discarded:
  - median aggregation for the categories (relaxes the budget);
  - a discarded extra Lighthouse run (looks like dropping a measurement);
  - blind reruns.
- If CI still fails after this change, PERF-01 stays open, with the new
  evidence recorded.

## TODO

- [x] **P1** — `ejecutor`: implement the warm-up with tests, on branch
  `fix/lighthouse-cold-start`.
  - `warmUp(url, port)` runs once, before run 1. `warmUpBrowser` opens
    `about:blank` via `PUT /json/new`, sends `Page.navigate` and waits for
    `loadEventFired`, with timeouts on the socket and both fetches; the tab is
    closed in `finally`.
  - Tests: 4 for ordering/cleanup (RED 40/3 → GREEN 43/0) and 9 against a
    fake DevTools endpoint (RED 49/3 → GREEN 52/0).
  - Gates: `bun run test` 623 pass / 0 fail; `check` 0/0/0; format and build
    pass.
  - Real local Lighthouse run: one warm-up, then five runs scoring 1, TBT 0,
    LCP median 1434.6 ms; no extra report files.
- [x] **P2** — `revisor`: review. First pass: CHANGES_REQUESTED (no direct
  tests; load-before-reply race; fetch timeouts; `JSON.parse` guard). After
  the fixes: **APPROVED**; the reviewer mutation-tested the fixes in a copy.
  The parent then replaced two vacuous `.toContain('')` assertions with
  `SyntaxError` / `TimeoutError` name checks (52/0 in 3 of 3 runs).
- [x] **P3** — Parent: commit, push, open the PR, observe CI, report.
  - Commit `008a5f1`, PR #4.
  - CI run `39801614125`: all steps pass. Lighthouse: warm-up once; runs 1–5
    performance 1; TBT 0 on all five; LCP median 1435.9 ms (the existing WARN).
  - One green observation versus three earlier first-run failures; keep
    watching later runs on `main`.
  - Merge pending user confirmation.

## Acceptance

- Exactly 5 measured runs; budgets unchanged; the warm-up happens once,
  before run 1.
- A warm-up failure fails the run loudly; it is never silently skipped.
- Cleanup (browser and server) also covers the warm-up path.
- `bun run test`, `check`, `format:check` and `build` pass.
- The CI Lighthouse step on the PR is observed (pass or fail recorded).
