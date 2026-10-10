import { describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import {
  evaluateReports,
  runMeasurements,
  startStaticServer,
  launchOwnedBrowser,
  withInterruptSignals,
} from './lighthouse-ci'

const config = createRequire(import.meta.url)('../.lighthouserc.cjs').ci
const makeReport = () => ({
  lighthouseVersion: '13.5.0',
  categories: Object.fromEntries(
    ['performance', 'accessibility', 'best-practices', 'seo'].map((id) => [
      id,
      { score: 1 },
    ]),
  ),
  audits: Object.fromEntries(
    [
      'largest-contentful-paint',
      'first-contentful-paint',
      'server-response-time',
      'total-blocking-time',
      'cumulative-layout-shift',
    ].map((id) => [id, { numericValue: 0 }]),
  ),
})
async function expectRejected(promise: Promise<unknown>) {
  let rejected = false
  try {
    await promise
  } catch {
    rejected = true
  }
  expect(rejected).toBe(true)
}

const reports = () => Array.from({ length: 5 }, makeReport)

describe('Lighthouse assertion contract', () => {
  test('retains the authoritative five mobile runs and exact severity budgets', () => {
    expect(config.collect).toEqual({
      staticDistDir: './dist',
      url: ['index.html'],
      numberOfRuns: 5,
      settings: { formFactor: 'mobile' },
    })
    expect(config.assert.assertions).toEqual({
      'categories:performance': ['error', { minScore: 1 }],
      'categories:accessibility': ['error', { minScore: 1 }],
      'categories:best-practices': ['error', { minScore: 1 }],
      'categories:seo': ['error', { minScore: 1 }],
      'largest-contentful-paint': [
        'warn',
        { maxNumericValue: 1200, aggregationMethod: 'median' },
      ],
      'first-contentful-paint': [
        'warn',
        { maxNumericValue: 1000, aggregationMethod: 'median' },
      ],
      'server-response-time': [
        'error',
        { maxNumericValue: 300, aggregationMethod: 'median' },
      ],
      'total-blocking-time': [
        'error',
        { maxNumericValue: 50, aggregationMethod: 'median' },
      ],
      'cumulative-layout-shift': [
        'error',
        { maxNumericValue: 0.02, aggregationMethod: 'median' },
      ],
    })
  })
  test('passes valid reports and evaluates every run', () => {
    const result = evaluateReports(reports(), config)
    expect(result.failed).toBe(false)
    expect(result.assertions).toHaveLength(9)
    expect(result.assertions.every((a) => a.values.length === 5)).toBe(true)
  })
  test('uses real numeric medians, not the representative or fastest run', () => {
    const input = reports()
    input.forEach((r, i) => {
      r.audits['total-blocking-time'].numericValue = [0, 100, 60, 55, 0][i]
    })
    const result = evaluateReports(input, config)
    expect(result.failed).toBe(true)
    expect(
      result.assertions.find((a) => a.id === 'total-blocking-time')?.actual,
    ).toBe(55)
  })
  test('warnings do not fail but remain visible in assertion results', () => {
    const input = reports()
    input.forEach((r) => {
      r.audits['largest-contentful-paint'].numericValue = 1400
    })
    const result = evaluateReports(input, config)
    expect(result.failed).toBe(false)
    expect(
      result.assertions.find((a) => a.id === 'largest-contentful-paint'),
    ).toMatchObject({ level: 'warn', passed: false, actual: 1400 })
  })
  test('requires all four categories in every run, stronger than LHCI optimistic default', () => {
    const input = reports()
    input[0].categories.seo.score = 0.99
    expect(evaluateReports(input, config).failed).toBe(true)
  })
  test.each([
    { input: [] },
    { input: reports().slice(1) },
    { input: [...reports(), makeReport()] },
  ])('rejects incorrect run count', ({ input }) => {
    expect(() => evaluateReports(input, config)).toThrow()
  })
  test.each([undefined, null, NaN, Infinity, -1, '0'])(
    'fails closed on missing or invalid metric %s, including warnings',
    (value) => {
      const input: any[] = reports()
      input[0].audits['largest-contentful-paint'].numericValue = value
      expect(() => evaluateReports(input, config)).toThrow()
    },
  )
  test('rejects missing audit/category and runtime errors', () => {
    for (const mutate of [
      (r: any) => delete r.audits['server-response-time'],
      (r: any) => delete r.categories.seo,
      (r: any) => {
        r.runtimeError = { code: 'NO_FCP' }
      },
      (r: any) => {
        r.categories.seo.score = 2
      },
    ]) {
      const input = reports()
      mutate(input[0])
      expect(() => evaluateReports(input, config)).toThrow()
    }
  })
  test('rejects unsupported aggregation or assertion configuration', () => {
    const altered = structuredClone(config)
    altered.assert.assertions['total-blocking-time'][1].aggregationMethod =
      'fastest'
    expect(() => evaluateReports(reports(), altered)).toThrow()
  })
})

describe('owned execution boundary', () => {
  test('serves only real files confined to dist on an ephemeral loopback port', async () => {
    const root = await mkdtemp(join(tmpdir(), 'portfolio-lighthouse-test-'))
    await mkdir(join(root, 'dist'))
    await writeFile(join(root, 'dist/index.html'), '<h1>fixture</h1>')
    await writeFile(join(root, 'private.txt'), 'outside')
    await symlink(join(root, 'private.txt'), join(root, 'dist/link.txt'))
    const server = await startStaticServer(join(root, 'dist'))
    try {
      expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/)
      expect(await (await fetch(server.url)).text()).toBe('<h1>fixture</h1>')
      expect((await fetch(`${server.url}link.txt`)).status).toBe(404)
      expect((await fetch(`${server.url}%2e%2e%2fprivate.txt`)).status).toBe(
        404,
      )
      expect((await fetch(server.url, { method: 'POST' })).status).toBe(405)
    } finally {
      await server.close()
      await rm(root, { recursive: true, force: true })
    }
    await expectRejected(fetch(server.url))
  })
  test.each(['success', 'measurement', 'launch', 'write', 'abort'])(
    'cleans owned resources on %s without swallowing errors',
    async (scenario) => {
      const events: string[] = []
      const controller = new AbortController()
      const options = {
        config,
        signal: controller.signal,
        startServer: async () => ({
          url: 'http://127.0.0.1:9999/',
          close: async () => {
            events.push('server-close')
          },
        }),
        launch: async () => {
          if (scenario === 'launch') throw Error('launch')
          return {
            port: 9998,
            kill: async () => {
              events.push('browser-kill')
            },
          }
        },
        measure: async () => {
          if (scenario === 'measurement') throw Error('measurement')
          if (scenario === 'abort') controller.abort()
          return {
            lhr: makeReport(),
            report: [JSON.stringify(makeReport()), '<html>report</html>'],
          }
        },
        save: async () => {
          if (scenario === 'write') throw Error('write')
          events.push('save')
        },
      }
      if (scenario === 'success')
        expect((await runMeasurements(options)).failed).toBe(false)
      else await expectRejected(runMeasurements(options))
      expect(events.filter((e) => e === 'server-close')).toHaveLength(1)
      expect(events.filter((e) => e === 'browser-kill')).toHaveLength(
        scenario === 'launch' ? 0 : 1,
      )
    },
  )
  test('rejects missing measurement output', async () => {
    await expectRejected(
      runMeasurements({
        config,
        startServer: async () => ({
          url: 'http://127.0.0.1:9999/',
          close: async () => {},
        }),
        launch: async () => ({ port: 9998, kill: async () => {} }),
        measure: async () => undefined,
        save: async () => {},
      }),
    )
  })
})

describe('browser startup and interruption ownership', () => {
  test('cleans partial launcher resources after startup failure', async () => {
    const events: string[] = []
    await expectRejected(
      launchOwnedBrowser({
        launch: async () => {
          throw Error('startup')
        },
        kill: () => {
          events.push('kill')
        },
        destroyTmp: () => {
          events.push('profile-cleanup')
        },
      }),
    )
    expect(events).toEqual(['kill', 'profile-cleanup'])
  })
  test.each(['SIGINT', 'SIGTERM'])(
    'routes %s into abort and removes its listeners',
    async (signalName) => {
      const signals = new EventEmitter()
      await withInterruptSignals(async (signal) => {
        expect(signal.aborted).toBe(false)
        signals.emit(signalName)
        expect(signal.aborted).toBe(true)
      }, signals)
      expect(signals.listenerCount('SIGINT')).toBe(0)
      expect(signals.listenerCount('SIGTERM')).toBe(0)
    },
  )
  test('propagates cleanup failures rather than returning a passing result', async () => {
    await expectRejected(
      runMeasurements({
        config,
        startServer: async () => ({
          url: 'http://127.0.0.1:9999/',
          close: async () => {
            throw Error('close')
          },
        }),
        launch: async () => ({
          port: 9998,
          kill: async () => {
            throw Error('kill')
          },
        }),
        measure: async () => ({
          lhr: makeReport(),
          report: [JSON.stringify(makeReport()), '<html>report</html>'],
        }),
        save: async () => {},
      }),
    )
  })
})

describe('numeric boundary and invalid output', () => {
  test.each([
    'server-response-time',
    'total-blocking-time',
    'cumulative-layout-shift',
  ])('fails the configured median error budget for %s', (id) => {
    const input = reports()
    const limit = config.assert.assertions[id][1].maxNumericValue
    input.forEach((r) => {
      r.audits[id].numericValue = limit + 1
    })
    expect(evaluateReports(input, config).failed).toBe(true)
  })
  test('retains arithmetic median for an even collection', () => {
    const input = reports().slice(1)
    input.forEach((r, i) => {
      r.audits['total-blocking-time'].numericValue = [0, 100, 60, 20][i]
    })
    expect(
      evaluateReports(input, {
        ...config,
        collect: { ...config.collect, numberOfRuns: 4 },
      }).assertions.find((a) => a.id === 'total-blocking-time')?.actual,
    ).toBe(40)
  })
  test.each(['not-json', '{}', ''])(
    'rejects invalid report data: %s',
    (raw) => {
      return expectRejected(
        runMeasurements({
          config,
          startServer: async () => ({
            url: 'http://127.0.0.1:9999/',
            close: async () => {},
          }),
          launch: async () => ({ port: 9998, kill: async () => {} }),
          measure: async () => ({
            lhr: makeReport(),
            report: [raw, '<html>report</html>'],
          }),
          save: async () => {},
        }),
      )
    },
  )
})

describe('LHCI static transport parity', () => {
  test('compresses negotiated text while preserving content types and identity responses', async () => {
    const root = await mkdtemp(
      join(tmpdir(), 'portfolio-lighthouse-transport-'),
    )
    const html = `<h1>${'compressible text '.repeat(1000)}</h1>`
    await writeFile(join(root, 'index.html'), html)
    await writeFile(join(root, 'style.css'), 'body { color: red }'.repeat(100))
    await writeFile(join(root, 'font.woff2'), new Uint8Array(2000))
    const server = await startStaticServer(root)
    try {
      const compressed = await fetch(server.url, {
        headers: { 'Accept-Encoding': 'gzip' },
      })
      expect(compressed.headers.get('Content-Encoding')).toBe('gzip')
      expect(compressed.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      )
      expect(compressed.headers.get('Vary')).toBe('Accept-Encoding')
      expect(Number(compressed.headers.get('Content-Length'))).toBeLessThan(
        html.length,
      )
      expect(await compressed.text()).toBe(html)
      const css = await fetch(`${server.url}style.css`, {
        headers: { 'Accept-Encoding': 'gzip' },
      })
      expect(css.headers.get('Content-Type')).toBe('text/css; charset=utf-8')
      expect(css.headers.get('Content-Encoding')).toBe('gzip')
      const identity = await fetch(server.url, {
        headers: { 'Accept-Encoding': 'gzip;q=0' },
      })
      expect(identity.headers.get('Content-Encoding')).toBeNull()
      expect(await identity.text()).toBe(html)
      const font = await fetch(`${server.url}font.woff2`, {
        headers: { 'Accept-Encoding': 'gzip' },
      })
      expect(font.headers.get('Content-Type')).toBe('font/woff2')
      expect(font.headers.get('Content-Encoding')).toBeNull()
    } finally {
      await server.close()
      await rm(root, { recursive: true, force: true })
    }
  })
})

test('rejects incomplete HTML report output', async () => {
  await expectRejected(
    runMeasurements({
      config,
      startServer: async () => ({
        url: 'http://127.0.0.1:9999/',
        close: async () => {},
      }),
      launch: async () => ({ port: 9998, kill: async () => {} }),
      measure: async () => ({
        lhr: makeReport(),
        report: [JSON.stringify(makeReport()), 'not an HTML report'],
      }),
      save: async () => {},
    }),
  )
})

describe('post-measurement trace diagnostics', () => {
  test.each([false, true])(
    'preserves traces only after all five measurements when failed=%s',
    async (failed) => {
      const saved = new Map<string, string>()
      const events: string[] = []
      let measures = 0
      const trace = {
        traceEvents: [
          {
            name: 'TracingStartedInPage',
            cat: 'devtools.timeline',
            ph: 'I',
            pid: 1,
            tid: 1,
            ts: 900,
            args: { data: { page: 'main' } },
          },
          {
            name: 'thread_name',
            cat: '__metadata',
            ph: 'M',
            pid: 1,
            tid: 1,
            ts: 900,
            args: { name: 'CrRendererMain' },
          },
          {
            name: 'navigationStart',
            cat: 'blink.user_timing',
            ph: 'I',
            pid: 1,
            tid: 1,
            ts: 950,
            args: {
              frame: 'main',
              data: { documentLoaderURL: 'https://example.com/' },
            },
          },
          {
            name: 'ParseHTML',
            cat: 'devtools.timeline',
            ph: 'X',
            pid: 1,
            tid: 1,
            ts: 1000,
            dur: 100,
            args: {},
          },
        ],
      }
      const result = await runMeasurements({
        config,
        startServer: async () => ({
          url: 'http://127.0.0.1:9999/',
          close: async () => {
            events.push('close')
          },
        }),
        launch: async () => ({
          port: 9998,
          kill: async () => {
            events.push('kill')
          },
        }),
        measure: async () => {
          measures++
          events.push(`measure-${measures}`)
          const report = makeReport()
          if (failed && measures === 1)
            report.categories.performance.score = 0.89
          return {
            lhr: report,
            report: [JSON.stringify(report), '<html>report</html>'],
            artifacts: { Trace: trace },
          }
        },
        save: async (name, body) => {
          if (name.includes('trace')) expect(measures).toBe(5)
          events.push(name)
          saved.set(name, body)
        },
      })
      expect(result.failed).toBe(failed)
      expect(measures).toBe(5)
      expect(events.filter((event) => event === 'close')).toHaveLength(1)
      expect(events.filter((event) => event === 'kill')).toHaveLength(1)
      expect(
        [...saved.keys()].filter((name) => name.endsWith('.trace.json')),
      ).toHaveLength(failed ? 5 : 0)
      expect(
        [...saved.keys()].filter((name) =>
          name.endsWith('.trace-summary.json'),
        ),
      ).toHaveLength(failed ? 5 : 0)
      if (failed) {
        expect(JSON.parse(saved.get('run-1.trace.json')!)).toEqual(trace)
        const summary = JSON.parse(saved.get('run-1.trace-summary.json')!)
        expect(summary.status).toBe('available')
        expect(summary.rootTasks[0].name).toBe('ParseHTML')
        expect(summary.rootTasks[0].selfTimeMs).toBe(0.1)
        expect(summary.rootTasks[0].startTimeMs).toBe(0.05)
        expect(events.indexOf('run-1.trace.json')).toBeGreaterThan(
          events.indexOf('measure-5'),
        )
      }
    },
  )
  test('trace diagnostic write errors remain fatal and clean owned resources', async () => {
    let measures = 0
    const cleanup: string[] = []
    let rejected = false
    try {
      await runMeasurements({
        config,
        startServer: async () => ({
          url: 'http://127.0.0.1:9999/',
          close: async () => {
            cleanup.push('server')
          },
        }),
        launch: async () => ({
          port: 9998,
          kill: async () => {
            cleanup.push('browser')
          },
        }),
        measure: async () => {
          measures++
          const report = makeReport()
          report.categories.performance.score = 0.89
          return {
            lhr: report,
            report: [JSON.stringify(report), '<html>report</html>'],
            artifacts: { Trace: { traceEvents: [] } },
          }
        },
        save: async (name) => {
          if (name.includes('trace')) throw new Error('trace-write')
        },
      })
    } catch (error) {
      rejected = error instanceof Error && error.message === 'trace-write'
    }
    expect(rejected).toBe(true)
    expect(measures).toBe(5)
    expect(cleanup.sort()).toEqual(['browser', 'server'])
  })
})
