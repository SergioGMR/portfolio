import { createServer } from 'node:http'
import type { ChildProcess } from 'node:child_process'
import type { EventEmitter } from 'node:events'
import { readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'

interface Budget {
  minScore?: number
  maxNumericValue?: number
  aggregationMethod?: 'median'
}
interface CIConfig {
  collect: {
    staticDistDir: string
    url: string[]
    numberOfRuns: number
    settings: { formFactor: 'mobile' }
  }
  assert: { assertions: Record<string, ['error' | 'warn', Budget]> }
  upload: { target: 'filesystem'; outputDir: string }
}
interface Report {
  lighthouseVersion: string
  runtimeError?: unknown
  categories: Record<string, { score: number | null }>
  audits: Record<string, { numericValue?: number; errorMessage?: string }>
}
interface Measurement {
  lhr: Report
  report: string | string[]
  artifacts?: { Trace?: unknown }
}
interface OwnedServer {
  url: string
  close(): Promise<void>
}
interface OwnedBrowser {
  port: number
  kill(): Promise<unknown>
}
export interface Assertion {
  id: string
  level: 'error' | 'warn'
  aggregation: 'median' | 'all-runs'
  values: number[]
  actual: number
  expected: number
  passed: boolean
}

// LHCI's explicit median uses the arithmetic middle pair for even run counts.
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

export function evaluateReports(reports: readonly Report[], config: CIConfig) {
  if (
    !Number.isInteger(config.collect.numberOfRuns) ||
    config.collect.numberOfRuns < 1 ||
    reports.length !== config.collect.numberOfRuns
  ) {
    throw new Error('Missing or unexpected Lighthouse runs')
  }
  if (!Object.keys(config.assert.assertions).length) {
    throw new Error('No Lighthouse assertions configured')
  }
  for (const report of reports) {
    if (
      typeof report?.lighthouseVersion !== 'string' ||
      !report.lighthouseVersion.trim() ||
      report.runtimeError
    ) {
      throw new Error('Invalid Lighthouse report or runtime error')
    }
  }
  const assertions: Assertion[] = Object.entries(config.assert.assertions).map(
    ([id, [level, budget]]) => {
      const category = id.startsWith('categories:')
      const expected = category ? budget.minScore : budget.maxNumericValue
      const aggregation = budget.aggregationMethod ?? 'all-runs'
      if (
        !['error', 'warn'].includes(level) ||
        (aggregation !== 'median' && aggregation !== 'all-runs') ||
        !Number.isFinite(expected) ||
        Object.keys(budget).some(
          (key) =>
            ![
              category ? 'minScore' : 'maxNumericValue',
              'aggregationMethod',
            ].includes(key),
        )
      ) {
        throw new Error(`Unsupported assertion: ${id}`)
      }
      const values = reports.map((report, run) => {
        const value = category
          ? report.categories?.[id.slice('categories:'.length)]?.score
          : report.audits?.[id]?.numericValue
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < 0 ||
          (category && value > 1) ||
          (!category && report.audits[id].errorMessage)
        ) {
          throw new Error(`Invalid or missing ${id} in run ${run + 1}`)
        }
        return value
      })
      // Enforcing every category score is stronger than LHCI's default optimistic
      // aggregation; all explicitly declared metric medians remain unchanged.
      const actual =
        aggregation === 'median'
          ? median(values)
          : category
            ? Math.min(...values)
            : Math.max(...values)
      return {
        id,
        level,
        aggregation,
        values,
        actual,
        expected: expected!,
        passed: category ? actual >= expected! : actual <= expected!,
      }
    },
  )
  return {
    assertions,
    failed: assertions.some((a) => a.level === 'error' && !a.passed),
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

function isWithin(root: string, path: string) {
  const diff = relative(root, path)
  return !isAbsolute(diff) && diff !== '..' && !diff.startsWith(`..${sep}`)
}

const gzipAsync = promisify(gzip)

function acceptsGzip(header: string | undefined): boolean {
  return (header ?? '').split(',').some((entry) => {
    const [encoding, ...parameters] = entry.trim().toLowerCase().split(';')
    if (encoding !== 'gzip') return false
    const q = parameters
      .map((value) => value.trim())
      .find((value) => value.startsWith('q='))
    const quality = q === undefined ? 1 : Number(q.slice(2))
    return Number.isFinite(quality) && quality > 0 && quality <= 1
  })
}

export async function startStaticServer(
  directory: string,
): Promise<OwnedServer> {
  const root = await realpath(directory)
  if (!(await stat(root)).isDirectory())
    throw new Error('Static dist is not a directory')
  const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405).end()
      return
    }
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://127.0.0.1').pathname,
      )
      let path = resolve(root, `.${pathname}`)
      if (!isWithin(root, path)) throw new Error('Path outside dist')
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
      path = await realpath(path)
      if (!isWithin(root, path) || !(await stat(path)).isFile())
        throw new Error('Invalid static file')
      let body = await readFile(path)
      const contentType = MIME[extname(path)] ?? 'application/octet-stream'
      const compressible =
        /^(text\/|application\/(json|xml)|image\/svg\+xml)/.test(contentType)
      const compressed =
        compressible &&
        body.length >= 1024 &&
        acceptsGzip(request.headers['accept-encoding'])
      // The old LHCI fallback server compresses text. Preserve its measured
      // gzip transport rather than inflating simulated transfer costs.
      if (compressed) body = await gzipAsync(body)
      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': body.length,
        ...(compressible ? { Vary: 'Accept-Encoding' } : {}),
        ...(compressed ? { 'Content-Encoding': 'gzip' } : {}),
      })
      response.end(request.method === 'HEAD' ? undefined : body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>((accept, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      accept()
    })
  })
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing static server port')
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () =>
      new Promise<void>((accept, reject) => {
        server.close((error) => (error ? reject(error) : accept()))
        server.closeAllConnections()
      }),
  }
}

interface BrowserLauncher {
  port?: number
  chromeProcess?: ChildProcess
  launch(): Promise<void>
  kill(): void
  destroyTmp(): void
}

// Retain the launcher before launch: the convenience launch() API cannot return
// its handle when startup fails after creating a profile or browser process.
export async function launchOwnedBrowser(
  launcher: BrowserLauncher,
  signal?: AbortSignal,
): Promise<OwnedBrowser> {
  let closing: Promise<void> | undefined
  const kill = () =>
    (closing ??= (async () => {
      const child = launcher.chromeProcess
      const closed =
        child && child.exitCode === null && child.signalCode === null
          ? new Promise<void>((accept, reject) => {
              const timer = setTimeout(() => {
                child.off('close', done)
                reject(new Error('Owned browser did not close'))
              }, 5000)
              const done = () => {
                clearTimeout(timer)
                accept()
              }
              child.once('close', done)
            })
          : Promise.resolve()
      launcher.kill()
      await closed
      launcher.destroyTmp()
    })())
  const onAbort = () => {
    // Startup can still acquire a process after this event; the catch below
    // repeats cleanup after launch settles, covering that ownership race.
    launcher.kill()
  }
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    signal?.throwIfAborted()
    await launcher.launch()
    signal?.throwIfAborted()
    if (!launcher.port) throw new Error('Missing browser debugging port')
    return { port: launcher.port, kill }
  } catch (error) {
    await kill()
    throw error
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}

export async function withInterruptSignals<T>(
  run: (signal: AbortSignal) => Promise<T>,
  signals: Pick<EventEmitter, 'once' | 'removeListener'> = process,
): Promise<T> {
  const controller = new AbortController()
  const interrupt = () => controller.abort(new Error('Lighthouse interrupted'))
  signals.once('SIGINT', interrupt)
  signals.once('SIGTERM', interrupt)
  try {
    return await run(controller.signal)
  } finally {
    signals.removeListener('SIGINT', interrupt)
    signals.removeListener('SIGTERM', interrupt)
  }
}

interface Execution {
  config: CIConfig
  signal?: AbortSignal
  startServer(): Promise<OwnedServer>
  launch(): Promise<OwnedBrowser>
  measure(url: string, port: number): Promise<Measurement | undefined>
  save(name: string, body: string): Promise<void>
}

export async function runMeasurements(options: Execution) {
  const { config, signal } = options
  if (
    config.collect.settings.formFactor !== 'mobile' ||
    config.collect.url.length !== 1 ||
    config.collect.url[0] !== 'index.html' ||
    !Number.isInteger(config.collect.numberOfRuns) ||
    config.collect.numberOfRuns < 1 ||
    config.upload.target !== 'filesystem'
  )
    throw new Error('Unsupported Lighthouse collection or upload configuration')
  const reports: Report[] = []
  const traces: unknown[] = []
  let server: OwnedServer | undefined
  let browser: OwnedBrowser | undefined
  let serverClose: Promise<void> | undefined
  let browserClose: Promise<unknown> | undefined
  const cleanup = async () => {
    if (browser && !browserClose)
      browserClose = Promise.resolve().then(() => browser!.kill())
    if (server && !serverClose)
      serverClose = Promise.resolve().then(() => server!.close())
    const outcomes = await Promise.allSettled([browserClose, serverClose])
    const errors = outcomes
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason)
    if (errors.length)
      throw new AggregateError(errors, 'Owned Lighthouse cleanup failed')
  }
  const onAbort = () => {
    void cleanup().catch(() => {})
  }
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    signal?.throwIfAborted()
    server = await options.startServer()
    signal?.throwIfAborted()
    browser = await options.launch()
    signal?.throwIfAborted()
    console.log(`Lighthouse serving ${server.url}`)
    for (let run = 1; run <= config.collect.numberOfRuns; run++) {
      signal?.throwIfAborted()
      const result = await options.measure(
        new URL(config.collect.url[0], server.url).href,
        browser.port,
      )
      signal?.throwIfAborted()
      if (
        !result?.lhr ||
        !Array.isArray(result.report) ||
        result.report.length !== 2 ||
        result.report.some(
          (body) => typeof body !== 'string' || !body.trim(),
        ) ||
        !/<html(?:\s|>)/i.test(result.report[1]) ||
        !/<\/html\s*>/i.test(result.report[1])
      ) {
        throw new Error(`Missing Lighthouse report output in run ${run}`)
      }
      const report: Report = JSON.parse(result.report[0])
      evaluateReports([report], {
        ...config,
        collect: { ...config.collect, numberOfRuns: 1 },
      })
      reports.push(report)
      // Retain only references while measuring; serialize/process after the batch.
      traces.push(result.artifacts?.Trace)
      await options.save(`run-${run}.report.json`, result.report[0])
      await options.save(`run-${run}.report.html`, result.report[1])
      console.log(
        `Run ${run}/${config.collect.numberOfRuns}: Lighthouse ${result.lhr.lighthouseVersion}; ${JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([id, category]) => [id, category.score])))}`,
      )
    }
    signal?.throwIfAborted()
    const result = evaluateReports(reports, config)
    await options.save('assertions.json', JSON.stringify(result, null, 2))
    if (result.failed) {
      // Node's native TypeScript loader needs the extension; a URL also keeps
      // this post-batch import compatible with the existing TS configuration.
      const {
        hasTraceEvents,
        summarizeTrace,
      }: typeof import('./lighthouse-trace') = await import(
        new URL('./lighthouse-trace.ts', import.meta.url).href
      )
      for (const [index, trace] of traces.entries()) {
        signal?.throwIfAborted()
        if (hasTraceEvents(trace))
          await options.save(
            `run-${index + 1}.trace.json`,
            JSON.stringify(trace),
          )
        await options.save(
          `run-${index + 1}.trace-summary.json`,
          JSON.stringify(await summarizeTrace(trace)),
        )
      }
    }
    signal?.throwIfAborted()
    for (const assertion of result.assertions) {
      console.log(
        `${assertion.passed ? 'PASS' : assertion.level.toUpperCase()} ${assertion.id}: ${assertion.actual} (${assertion.aggregation}; budget ${assertion.expected}; runs ${assertion.values.join(', ')})`,
      )
    }
    return result
  } finally {
    signal?.removeEventListener('abort', onAbort)
    await cleanup()
  }
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const config: CIConfig = createRequire(import.meta.url)(
    resolve(root, '.lighthouserc.cjs'),
  ).ci
  const output = resolve(root, config.upload.outputDir, `run-${Date.now()}`)
  await mkdir(output, { recursive: true })
  const [{ default: lighthouse }, chromeLauncher] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
  ])
  const result = await withInterruptSignals((signal) =>
    runMeasurements({
      config,
      signal,
      startServer: () =>
        startStaticServer(resolve(root, config.collect.staticDistDir)),
      launch: () =>
        launchOwnedBrowser(
          new chromeLauncher.Launcher({
            chromePath: process.env.CHROME_PATH || undefined,
            chromeFlags: [
              '--headless',
              '--disable-dev-shm-usage',
              ...(process.env.CI ? ['--no-sandbox'] : []),
            ],
            handleSIGINT: false,
          }),
          signal,
        ),
      measure: (url, port) =>
        lighthouse(url, {
          ...config.collect.settings,
          port,
          output: ['json', 'html'],
          logLevel: 'error',
        }) as Promise<Measurement | undefined>,
      save: (name, body) => writeFile(resolve(output, name), body, 'utf8'),
    }),
  )
  console.log(`Filesystem reports: ${relative(root, output)}`)
  if (result.failed) process.exitCode = 1
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
