import { existsSync, readdirSync, rmSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Renders `docs/cv/sergio-morales-{es,en}.html` to `public/sergio-morales-{es,en}.pdf`
 * with headless Chromium and rewrites the PDF document Info, without
 * dependencies.
 *
 * Usage: `bun run cv:build`
 * Chromium: `CV_CHROME_PATH=/path/to/chrome bun run cv:build`; otherwise the
 * newest Playwright headless shell (or Chromium) in
 * `~/Library/Caches/ms-playwright` (macOS) or `~/.cache/ms-playwright` (Linux)
 * is used.
 */

export const CV_LOCALES = ['es', 'en'] as const
export const CV_AUTHOR = 'Sergio Morales Rodríguez'

const CHROME_TIMEOUT_MS = 60_000
/** Grace between SIGTERM and SIGKILL when Chromium hangs. */
const CHROME_KILL_GRACE_MS = 2_000
/** Upper bound for draining stderr once Chromium has exited. */
const STDERR_DRAIN_MS = 1_000
/** Upper bound for the browser's process group to disappear after SIGKILL. */
const GROUP_REAP_WAIT_MS = 1_000

const rootUrl = new URL('../', import.meta.url)

export interface PdfInfoFields {
  title: string
  author: string
  creator: string
}

export function extractHtmlTitle(html: string): string {
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim()
  if (!title) throw new Error('CV HTML: expected a non-empty <title>')
  if (title.includes('&'))
    throw new Error('CV HTML: HTML entities in <title> are not supported')
  return title
}

const MAC_CHROME = join(
  'Google Chrome for Testing.app',
  'Contents',
  'MacOS',
  'Google Chrome for Testing',
)

// Playwright's headless shell is preferred: its `--print-to-pdf` CLI exits on
// its own, while the full Chromium binary can stay running in headless mode.
const PLAYWRIGHT_BROWSERS = [
  {
    prefix: 'chromium_headless_shell',
    executables: [
      join('chrome-headless-shell-mac-arm64', 'chrome-headless-shell'),
      join('chrome-headless-shell-mac-x64', 'chrome-headless-shell'),
      join('chrome-headless-shell-linux64', 'chrome-headless-shell'),
    ],
  },
  {
    prefix: 'chromium',
    executables: [
      join('chrome-mac-arm64', MAC_CHROME),
      join('chrome-mac-x64', MAC_CHROME),
      join('chrome-linux', 'chrome'),
      join('chrome-linux64', 'chrome'),
    ],
  },
] as const

function playwrightExecutables(root: string): string[] {
  if (!existsSync(root)) return []
  const revisions = readdirSync(root)
  return PLAYWRIGHT_BROWSERS.flatMap(({ prefix, executables }) =>
    revisions
      .filter((name) => new RegExp(`^${prefix}-\\d+$`).test(name))
      .sort(
        (left, right) =>
          Number(right.split('-').at(-1)) - Number(left.split('-').at(-1)),
      )
      .flatMap((name) => executables.map((path) => join(root, name, path))),
  ).filter((candidate) => existsSync(candidate))
}

export function findChromeExecutable(
  env: Record<string, string | undefined> = process.env,
  home = homedir(),
): string {
  // Dedicated variable: the generic CHROME_PATH belongs to scripts/lighthouse-ci.ts.
  if (env.CV_CHROME_PATH) {
    if (!existsSync(env.CV_CHROME_PATH))
      throw new Error(`CV_CHROME_PATH does not exist: ${env.CV_CHROME_PATH}`)
    return env.CV_CHROME_PATH
  }
  const [found] = [
    join(home, 'Library', 'Caches', 'ms-playwright'),
    join(home, '.cache', 'ms-playwright'),
  ].flatMap(playwrightExecutables)
  if (!found)
    throw new Error(
      'No Chromium found: set CV_CHROME_PATH or install the Playwright Chromium (ms-playwright cache)',
    )
  return found
}

/** UTF-16BE hex string with BOM, as the PDF spec requires for non-ASCII text. */
function pdfTextString(value: string): string {
  const units = Array.from({ length: value.length }, (_, index) =>
    value.charCodeAt(index).toString(16).toUpperCase().padStart(4, '0'),
  )
  return `<FEFF${units.join('')}>`
}

function readStringToken(dictionary: string, key: string): string | undefined {
  const keyMatch = new RegExp(`/${key}\\s*`).exec(dictionary)
  if (!keyMatch) return undefined
  const start = keyMatch.index + keyMatch[0].length
  if (dictionary[start] === '<') {
    const end = dictionary.indexOf('>', start)
    return end === -1 ? undefined : dictionary.slice(start, end + 1)
  }
  if (dictionary[start] !== '(') return undefined
  let depth = 0
  for (let index = start; index < dictionary.length; index += 1) {
    const character = dictionary[index]
    if (character === '\\') index += 1
    else if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return dictionary.slice(start, index + 1)
    }
  }
  return undefined
}

interface XrefSection {
  entries: Map<number, number>
  trailer: string
  prev: number | undefined
}

function readXrefSection(text: string, offset: number): XrefSection {
  if (!text.startsWith('xref', offset))
    throw new Error(
      `Unsupported PDF: expected a classic xref table at offset ${offset} (xref streams are not supported)`,
    )
  const trailerIndex = text.indexOf('trailer', offset)
  if (trailerIndex === -1) throw new Error('Unsupported PDF: trailer not found')
  const lines = text
    .slice(offset + 4, trailerIndex)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const entries = new Map<number, number>()
  for (let line = 0; line < lines.length;) {
    const [first, count] = lines[line]!.split(/\s+/).map(Number)
    line += 1
    for (let index = 0; index < count!; index += 1, line += 1) {
      const [entryOffset, , kind] = lines[line]!.split(/\s+/)
      if (kind === 'n') entries.set(first! + index, Number(entryOffset))
    }
  }
  const trailerEnd = text.indexOf('startxref', trailerIndex)
  const trailer = text.slice(trailerIndex, trailerEnd)
  const prev = trailer.match(/\/Prev\s+(\d+)/)
  return { entries, trailer, prev: prev ? Number(prev[1]) : undefined }
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

/**
 * Replaces the document Info of a classic-xref PDF (Skia/Chromium output) via
 * an incremental update: a new Info object, an xref section for it and a
 * trailer with `/Prev`. Title, Author and Creator come from `fields`;
 * Producer and the dates are carried over from the previous Info.
 *
 * The previous Info dictionary is blanked in place with spaces (same byte
 * length, so every xref offset stays valid) so that the browser user agent
 * Chromium writes into `/Creator` does not survive anywhere in the file.
 */
export function setPdfInfo(pdf: Buffer, fields: PdfInfoFields): Buffer {
  const text = pdf.toString('latin1')
  const startxref = text.match(/startxref\s+(\d+)\s+%%EOF\s*$/)
  if (!startxref) throw new Error('Invalid PDF: startxref/%%EOF not found')
  const previousXref = Number(startxref[1])

  const newest = readXrefSection(text, previousXref)
  const infoRef = newest.trailer.match(/\/Info\s+(\d+)\s+(\d+)\s+R/)
  const size = newest.trailer.match(/\/Size\s+(\d+)/)
  const root = newest.trailer.match(/\/Root\s+(\d+\s+\d+\s+R)/)
  if (!infoRef || !size || !root)
    throw new Error('Invalid PDF: trailer needs /Size, /Root and /Info')
  const infoNumber = Number(infoRef[1])
  const infoGeneration = Number(infoRef[2])

  let infoOffset: number | undefined
  for (
    let section: XrefSection | undefined = newest;
    section && infoOffset === undefined;
    section =
      section.prev === undefined
        ? undefined
        : readXrefSection(text, section.prev)
  ) {
    infoOffset = section.entries.get(infoNumber)
  }
  if (
    infoOffset === undefined ||
    !text.startsWith(`${infoNumber} `, infoOffset)
  )
    throw new Error('Invalid PDF: Info object not found in the xref table')

  const infoEnd = text.indexOf('endobj', infoOffset)
  const dictionaryStart = text.indexOf('<<', infoOffset)
  const dictionaryEnd = text.lastIndexOf('>>', infoEnd)
  if (dictionaryStart === -1 || dictionaryEnd < dictionaryStart)
    throw new Error('Invalid PDF: unsupported Info dictionary')
  const previousInfo = text.slice(dictionaryStart, dictionaryEnd + 2)

  const entries = [
    `/Title ${pdfTextString(fields.title)}`,
    `/Author ${pdfTextString(fields.author)}`,
    `/Creator ${pdfTextString(fields.creator)}`,
  ]
  for (const key of ['Producer', 'CreationDate', 'ModDate']) {
    const token = readStringToken(previousInfo, key)
    if (token) entries.push(`/${key} ${token}`)
  }

  const scrubbed =
    text.slice(0, dictionaryStart + 2) +
    ' '.repeat(dictionaryEnd - dictionaryStart - 2) +
    text.slice(dictionaryEnd)

  const separator = scrubbed.endsWith('\n') ? '' : '\n'
  const infoObjectOffset = scrubbed.length + separator.length
  const infoObject = `${infoNumber} ${infoGeneration} obj\n<<${entries.join('\n')}>>\nendobj\n`
  const xrefOffset = infoObjectOffset + infoObject.length
  const update =
    `xref\n${infoNumber} 1\n${pad(infoObjectOffset, 10)} ${pad(infoGeneration, 5)} n \n` +
    `trailer\n<</Size ${size[1]}\n/Root ${root[1]}\n/Info ${infoNumber} ${infoGeneration} R\n/Prev ${previousXref}>>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(scrubbed + separator + infoObject + update, 'latin1')
}

export interface RenderCvPdfOptions {
  htmlPath: string
  outputPath: string
  chromePath: string
  /** Kill Chromium after this long (default 60s). */
  timeoutMs?: number
  /** Wait this long after SIGTERM before SIGKILL (default 2s). */
  killGraceMs?: number
  /** Directory that holds the temporary browser profile (default `os.tmpdir()`); a test seam. */
  tempRoot?: string
  /** Removes the temporary profile directory (default `rm -rf`); a test seam. */
  removeDirectory?: (path: string) => Promise<void>
  /** Signals the browser's process group (default `process.kill(-pid, signal)`); a test seam. */
  killProcessGroup?: (pid: number, signal: NodeJS.Signals) => void
}

type KillProcessGroup = NonNullable<RenderCvPdfOptions['killProcessGroup']>

interface BrowserProcess {
  pid: number
  kill: (signal: NodeJS.Signals) => void
}

/** Signals interrupted by the user or the system that must also stop the detached browser. */
const FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

const defaultKillProcessGroup: KillProcessGroup = (pid, signal) => {
  // The browser is spawned detached, so it leads a group whose id is its pid.
  // Windows has no process groups: signal the process itself.
  process.kill(process.platform === 'win32' ? pid : -pid, signal)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** True while at least one process of the group still exists (ESRCH otherwise). */
function groupExists(groupId: number): boolean {
  try {
    process.kill(-groupId, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/**
 * A process group id is a pid: once the group is gone the id can be handed to
 * an unrelated process, so a late SIGKILL must first confirm the group exists.
 * Windows has no process groups to probe, so it always signals.
 */
function groupStillExists(groupId: number): boolean {
  return process.platform === 'win32' || groupExists(groupId)
}

/** Signals the browser's whole process group, tolerating a group that is already gone. */
function signalGroup(
  chrome: BrowserProcess,
  signal: NodeJS.Signals,
  killProcessGroup: KillProcessGroup,
): void {
  try {
    killProcessGroup(chrome.pid, signal)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}

/**
 * SIGTERM to the whole group, then SIGKILL once the grace period passes (or
 * as soon as nothing is left to wait for), but only while the group still
 * exists so a recycled group id is never signalled, then a
 * short wait so helpers stop writing before the profile directory is removed.
 * If the group cannot be signalled, the main process is killed directly and
 * the error is rethrown so the caller can report it.
 */
async function terminateGroup(
  chrome: BrowserProcess,
  killGraceMs: number,
  killProcessGroup: KillProcessGroup,
): Promise<void> {
  try {
    signalGroup(chrome, 'SIGTERM', killProcessGroup)
    const graceDeadline = Date.now() + killGraceMs
    while (groupExists(chrome.pid) && Date.now() < graceDeadline)
      await sleep(20)
    if (groupStillExists(chrome.pid))
      signalGroup(chrome, 'SIGKILL', killProcessGroup)
    const reapDeadline = Date.now() + GROUP_REAP_WAIT_MS
    while (groupExists(chrome.pid) && Date.now() < reapDeadline) await sleep(20)
  } catch (error) {
    // Best effort: at least stop the main process so the render can settle.
    try {
      chrome.kill('SIGKILL')
    } catch {}
    throw error
  }
}

export async function renderCvPdf({
  htmlPath,
  outputPath,
  chromePath,
  timeoutMs = CHROME_TIMEOUT_MS,
  killGraceMs = CHROME_KILL_GRACE_MS,
  tempRoot = tmpdir(),
  removeDirectory = (path) => rm(path, { recursive: true, force: true }),
  killProcessGroup = defaultKillProcessGroup,
}: RenderCvPdfOptions): Promise<void> {
  const title = extractHtmlTitle(await readFile(htmlPath, 'utf8'))
  const profileDirectory = await mkdtemp(join(tempRoot, 'cv-chrome-'))
  const rawPath = join(profileDirectory, 'raw.pdf')

  let failed = false
  let failure: unknown
  // Stays installed until every path that can still touch the browser or the
  // output has finished, so an interruption is never left to the default action.
  let removeForwarders = (): void => {}
  try {
    // Detached: Chromium leads its own process group, so a timeout can stop
    // its helper processes too instead of only the main one.
    const chrome = Bun.spawn(
      [
        chromePath,
        '--headless',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pdf-header-footer',
        `--user-data-dir=${join(profileDirectory, 'profile')}`,
        `--print-to-pdf=${rawPath}`,
        Bun.pathToFileURL(htmlPath).toString(),
      ],
      { stdout: 'ignore', stderr: 'pipe', detached: true },
    )
    // The browser no longer shares the terminal's foreground group, so
    // forward interruptions to it, then re-raise for the default behavior.
    const forwarders = FORWARDED_SIGNALS.map((signal) => {
      const forward = () => {
        removeForwarders()
        try {
          if (groupStillExists(chrome.pid))
            signalGroup(chrome, 'SIGKILL', killProcessGroup)
        } catch {}
        try {
          rmSync(profileDirectory, { recursive: true, force: true })
        } catch {}
        process.kill(process.pid, signal)
      }
      process.on(signal, forward)
      return [signal, forward] as const
    })
    removeForwarders = (): void => {
      for (const [signal, forward] of forwarders) process.off(signal, forward)
    }
    const stderrText = new Response(chrome.stderr).text().catch(() => '')
    const startedAt = Date.now()
    let timedOut = false
    let termination: Promise<void> | undefined
    let terminationError: unknown
    const timeout = setTimeout(() => {
      timedOut = true
      // Never leave this rejection unhandled: report it with the timeout.
      termination = terminateGroup(chrome, killGraceMs, killProcessGroup).catch(
        (error: unknown) => {
          terminationError = error
        },
      )
    }, timeoutMs)
    let exitCode: number
    try {
      exitCode = await chrome.exited
    } finally {
      clearTimeout(timeout)
    }
    // Never wait on stderr after a timeout: stray descendants may keep the pipe open.
    if (timedOut) {
      // Helpers can outlive the main process and keep writing to the profile.
      await termination
      throw new Error(
        `Chromium timed out after ${Date.now() - startedAt}ms printing ${htmlPath} (${chromePath})`,
        terminationError === undefined
          ? undefined
          : { cause: terminationError },
      )
    }
    let drainTimer: ReturnType<typeof setTimeout> | undefined
    const stderr = await Promise.race([
      stderrText,
      new Promise<string>((resolve) => {
        drainTimer = setTimeout(() => resolve(''), STDERR_DRAIN_MS)
      }),
    ]).finally(() => clearTimeout(drainTimer))
    if (exitCode !== 0 || !existsSync(rawPath))
      throw new Error(
        `Chromium failed to print ${htmlPath} (${exitCode}): ${stderr}`,
      )

    await writeFile(
      outputPath,
      setPdfInfo(await readFile(rawPath), {
        title,
        author: CV_AUTHOR,
        creator: CV_AUTHOR,
      }),
    )
  } catch (error) {
    failed = true
    failure = error
  }

  removeForwarders()
  try {
    await removeDirectory(profileDirectory)
  } catch (cleanupError) {
    // A cleanup failure must never replace the error that is already in flight.
    if (!failed) throw cleanupError
    if (failure instanceof Error && failure.cause === undefined)
      failure.cause = cleanupError
  }
  if (failed) throw failure
}

export async function buildCvPdfs(
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const chromePath = findChromeExecutable(env)
  for (const locale of CV_LOCALES) {
    const outputPath = fileURLToPath(
      new URL(`public/sergio-morales-${locale}.pdf`, rootUrl),
    )
    await renderCvPdf({
      htmlPath: fileURLToPath(
        new URL(`docs/cv/sergio-morales-${locale}.html`, rootUrl),
      ),
      outputPath,
      chromePath,
    })
    console.log(`CV PDF written: ${outputPath}`)
  }
}

if (import.meta.main) {
  buildCvPdfs().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
