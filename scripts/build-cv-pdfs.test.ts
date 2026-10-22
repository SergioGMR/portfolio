import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CV_AUTHOR,
  CV_LOCALES,
  extractHtmlTitle,
  findChromeExecutable,
  renderCvPdf,
  setPdfInfo,
} from './build-cv-pdfs'

const projectRoot = new URL('../', import.meta.url)
const temporaryRoots: string[] = []

// `renderCvPdf` creates a `cv-chrome-*` profile directory under its `tempRoot`.
// Every test gets a root of its own, so the guard below only looks at, and
// cleans, directories this test created: it can never touch the live profile
// of another run that shares the system temporary directory.
let tempRoot = ''
const chromeProfileDirectories = () =>
  readdirSync(tempRoot).filter((name) => name.startsWith('cv-chrome-'))

beforeEach(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), 'cv-temp-root-'))
})

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  )
  // A test must never leave a profile behind, even when it simulates a
  // cleanup failure.
  const leaked = chromeProfileDirectories()
  await rm(tempRoot, { recursive: true, force: true })
  expect(leaked).toEqual([])
})

const BROWSER_USER_AGENT_PATTERN = /HeadlessChrome|Mozilla\//

interface PdfStructure {
  /** Offset of every xref section, newest first. */
  xrefOffsets: number[]
  /** Newest offset of each object, resolved through the /Prev chain. */
  objectOffsets: Map<number, number>
  trailer: string
  info: Record<string, string>
  pageCount: number
}

// Minimal independent reader for classic-xref PDFs, so the tests do not trust
// the parser inside the script under test.
function readPdfStructure(pdf: Buffer): PdfStructure {
  const text = pdf.toString('latin1')
  const start = text.match(/startxref\s+(\d+)\s+%%EOF\s*$/)
  if (!start) throw new Error('startxref/%%EOF not found at the end')

  const xrefOffsets: number[] = []
  const objectOffsets = new Map<number, number>()
  let newestTrailer = ''
  let cursor: number | undefined = Number(start[1])

  while (cursor !== undefined) {
    xrefOffsets.push(cursor)
    if (!text.startsWith('xref', cursor))
      throw new Error(`xref keyword expected at offset ${cursor}`)
    const trailerIndex = text.indexOf('trailer', cursor)
    const lines = text
      .slice(cursor + 5, trailerIndex)
      .split('\n')
      .filter((line) => line !== '')
    let line = 0
    while (line < lines.length) {
      const [first, count] = lines[line]!.trim().split(/\s+/).map(Number)
      line += 1
      for (let index = 0; index < count!; index += 1, line += 1) {
        const entry = lines[line]!
        // Each classic xref entry is exactly 20 bytes including the EOL.
        expect(entry.length + 1).toBe(20)
        const [offset, , kind] = entry.trim().split(/\s+/)
        if (kind === 'n' && !objectOffsets.has(first! + index))
          objectOffsets.set(first! + index, Number(offset))
      }
    }
    const trailer = text.slice(
      trailerIndex,
      text.indexOf('startxref', trailerIndex),
    )
    if (newestTrailer === '') newestTrailer = trailer
    const prev = trailer.match(/\/Prev\s+(\d+)/)
    cursor = prev ? Number(prev[1]) : undefined
  }

  const infoRef = newestTrailer.match(/\/Info\s+(\d+)\s+(\d+)\s+R/)
  if (!infoRef) throw new Error('trailer has no /Info')
  const infoNumber = Number(infoRef[1])
  const infoOffset = objectOffsets.get(infoNumber)!
  expect(text.startsWith(`${infoNumber} ${infoRef[2]} obj`, infoOffset)).toBe(
    true,
  )
  for (const [number, offset] of objectOffsets) {
    expect(text.startsWith(`${number} 0 obj`, offset)).toBe(true)
  }
  const infoText = text.slice(infoOffset, text.indexOf('endobj', infoOffset))

  const info: Record<string, string> = {}
  for (const match of infoText.matchAll(
    /\/(\w+)\s*(<[0-9A-Fa-f\s]+>|\((?:\\.|[^\\)])*(?:\((?:\\.|[^\\)])*\)(?:\\.|[^\\)])*)*\))/g,
  )) {
    info[match[1]!] = decodePdfString(match[2]!)
  }

  return {
    xrefOffsets,
    objectOffsets,
    trailer: newestTrailer,
    info,
    pageCount: Array.from(text.matchAll(/\/Type\s*\/Page(?![\w])/g)).length,
  }
}

function decodePdfString(token: string): string {
  if (token.startsWith('<')) {
    const bytes = Buffer.from(token.slice(1, -1).replace(/\s/g, ''), 'hex')
    expect(bytes.subarray(0, 2).toString('hex')).toBe('feff')
    return bytes.subarray(2).swap16().toString('utf16le')
  }
  return token.slice(1, -1).replace(/\\(.)/g, '$1')
}

function buildSkiaLikePdf(): Buffer {
  const objects = [
    `1 0 obj\n<</Title <FEFF0054006500730074>\n/Creator (Mozilla/5.0 \\(X11; Linux x86_64\\) AppleWebKit/537.36 \\(KHTML, like Gecko\\) HeadlessChrome/150.0.0.0 Safari/537.36)\n/Producer (Skia/PDF m150)\n/CreationDate (D:20260726105521+00'00')\n/ModDate (D:20260726105521+00'00')>>\nendobj\n`,
    `2 0 obj\n<</Type /Catalog\n/Pages 3 0 R>>\nendobj\n`,
    `3 0 obj\n<</Type /Pages\n/Count 1\n/Kids [4 0 R]>>\nendobj\n`,
    `4 0 obj\n<</Type /Page\n/Parent 3 0 R\n/MediaBox [0 0 594.95996 841.91998]>>\nendobj\n`,
  ]
  let body = '%PDF-1.4\n%\xd3\xeb\xe9\xe1\n'
  const offsets: number[] = []
  for (const object of objects) {
    offsets.push(body.length)
    body += object
  }
  const xrefOffset = body.length
  body += `xref\n0 5\n0000000000 65535 f \n${offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join(
      '',
    )}trailer\n<</Size 5\n/Root 2 0 R\n/Info 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(body, 'latin1')
}

const infoToSet = {
  title: 'Sergio Morales Rodríguez — Tech Lead Full Stack',
  author: CV_AUTHOR,
  creator: CV_AUTHOR,
}

describe('setPdfInfo', () => {
  test('appends a classic incremental update whose latest Info has the expected metadata', () => {
    const original = buildSkiaLikePdf()
    const updated = setPdfInfo(original, infoToSet)
    const structure = readPdfStructure(updated)

    expect(structure.info.Title).toBe(infoToSet.title)
    expect(structure.info.Author).toBe('Sergio Morales Rodríguez')
    expect(structure.info.Creator).toBe('Sergio Morales Rodríguez')
    expect(structure.info.Producer).toBe('Skia/PDF m150')
    expect(structure.info.CreationDate).toBe("D:20260726105521+00'00'")
    expect(structure.info.ModDate).toBe("D:20260726105521+00'00'")
    expect(structure.xrefOffsets).toHaveLength(2)
    expect(structure.trailer).toMatch(/\/Size\s+5\b/)
    expect(structure.trailer).toMatch(/\/Root\s+2\s+0\s+R/)
    expect(structure.trailer).toContain(
      `/Prev ${readPdfStructure(original).xrefOffsets[0]}`,
    )
    expect(structure.pageCount).toBe(1)
    expect(updated.subarray(0, 9).toString('latin1')).toBe('%PDF-1.4\n')
    expect(updated.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true)
  })

  test('leaves no browser user agent anywhere in the file, not only in the latest Info', () => {
    expect(buildSkiaLikePdf().toString('latin1')).toMatch(
      BROWSER_USER_AGENT_PATTERN,
    )

    const updated = setPdfInfo(buildSkiaLikePdf(), infoToSet)

    expect(updated.toString('latin1')).not.toMatch(BROWSER_USER_AGENT_PATTERN)
  })

  test('keeps every original object offset valid by scrubbing the old Info in place', () => {
    const original = buildSkiaLikePdf()
    const updated = setPdfInfo(original, infoToSet)
    const originalText = original.toString('latin1')
    const updatedText = updated.toString('latin1')

    const oldInfoOffset = originalText.indexOf('1 0 obj')
    const oldInfoEnd = originalText.indexOf('endobj', oldInfoOffset)
    // Everything after the old Info object is byte-identical.
    expect(updatedText.slice(oldInfoEnd, original.length)).toBe(
      originalText.slice(oldInfoEnd),
    )
    expect(updatedText.slice(0, oldInfoOffset)).toBe(
      originalText.slice(0, oldInfoOffset),
    )
    expect(updatedText.length).toBeGreaterThan(original.length)
  })

  test('encodes non-ASCII text as a UTF-16BE hex string with a byte order mark', () => {
    const updated = setPdfInfo(buildSkiaLikePdf(), infoToSet)
    const text = updated.toString('latin1')

    expect(text).toContain(
      `/Author <FEFF${Buffer.from(CV_AUTHOR, 'utf16le')
        .swap16()
        .toString('hex')
        .toUpperCase()}>`,
    )
    expect(text).toMatch(/\/Title <FEFF[0-9A-F]+>/)
  })

  test('rejects PDFs that do not use a classic xref table', () => {
    const streamBased = Buffer.from(
      '%PDF-1.5\n1 0 obj\n<</Type /XRef>>\nstream\n\nendstream\nendobj\nstartxref\n9\n%%EOF\n',
      'latin1',
    )

    expect(() => setPdfInfo(streamBased, infoToSet)).toThrow(/classic xref/i)
    expect(() => setPdfInfo(Buffer.from('not a pdf'), infoToSet)).toThrow(
      /startxref/,
    )
  })
})

describe('extractHtmlTitle', () => {
  test('returns the document title of a CV page', () => {
    expect(
      extractHtmlTitle('<html><head><title>Sergio — CV</title></head></html>'),
    ).toBe('Sergio — CV')
    expect(() => extractHtmlTitle('<html></html>')).toThrow(/title/i)
  })
})

describe('findChromeExecutable', () => {
  test('prefers CV_CHROME_PATH when it points to an existing file', () => {
    expect(findChromeExecutable({ CV_CHROME_PATH: process.execPath })).toBe(
      process.execPath,
    )
  })

  test('discovers the newest Playwright headless shell before a full Chromium', async () => {
    const home = await mkdtemp(join(tmpdir(), 'cv-home-'))
    temporaryRoots.push(home)
    const cache = join(home, 'Library', 'Caches', 'ms-playwright')
    const shell = (revision: number) =>
      join(
        cache,
        `chromium_headless_shell-${revision}`,
        'chrome-headless-shell-mac-arm64',
        'chrome-headless-shell',
      )
    const full = join(
      cache,
      'chromium-2000',
      'chrome-mac-arm64',
      'Google Chrome for Testing.app',
      'Contents',
      'MacOS',
      'Google Chrome for Testing',
    )
    for (const executable of [shell(900), shell(1200), full]) {
      await mkdir(dirname(executable), { recursive: true })
      await writeFile(executable, '')
    }

    expect(findChromeExecutable({}, home)).toBe(shell(1200))
    await rm(shell(1200))
    await rm(shell(900))
    expect(findChromeExecutable({}, home)).toBe(full)
    await rm(full)
    expect(() => findChromeExecutable({}, home)).toThrow(/CV_CHROME_PATH/)
  })

  test('ignores the generic CHROME_PATH used by the Lighthouse script', async () => {
    const home = await mkdtemp(join(tmpdir(), 'cv-home-'))
    temporaryRoots.push(home)
    expect(() =>
      findChromeExecutable({ CHROME_PATH: process.execPath }, home),
    ).toThrow(/CV_CHROME_PATH/)
  })

  test('fails with an actionable message when CV_CHROME_PATH does not exist', () => {
    expect(() =>
      findChromeExecutable({ CV_CHROME_PATH: '/nonexistent/chrome' }),
    ).toThrow(/CV_CHROME_PATH/)
  })
})

describe('committed CV PDFs', () => {
  for (const locale of CV_LOCALES) {
    describe(`sergio-morales-${locale}.pdf`, () => {
      const pdfUrl = new URL(`public/sergio-morales-${locale}.pdf`, projectRoot)
      const htmlUrl = new URL(
        `docs/cv/sergio-morales-${locale}.html`,
        projectRoot,
      )

      test('is a valid PDF with the expected document Info', () => {
        const pdf = readFileSync(pdfUrl)
        const structure = readPdfStructure(pdf)
        const title = extractHtmlTitle(readFileSync(htmlUrl, 'utf8'))

        expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
        expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true)
        expect(structure.info.Title).toBe(title)
        expect(structure.info.Title).toBe(
          'Sergio Morales Rodríguez — Tech Lead Full Stack',
        )
        expect(structure.info.Author).toBe('Sergio Morales Rodríguez')
        expect(structure.info.Creator).toBe('Sergio Morales Rodríguez')
        expect(structure.info.Producer).toMatch(/^Skia\/PDF/)
        expect(structure.info.CreationDate).toMatch(/^D:\d{14}/)
      })

      test('carries no browser user agent anywhere in the file', () => {
        expect(readFileSync(pdfUrl).toString('latin1')).not.toMatch(
          BROWSER_USER_AGENT_PATTERN,
        )
      })

      test('keeps the one-page A4 layout of the previous CV', () => {
        const pdf = readFileSync(pdfUrl).toString('latin1')

        expect(readPdfStructure(readFileSync(pdfUrl)).pageCount).toBe(1)
        expect(pdf).toMatch(/\/MediaBox \[0 0 59\d(\.\d+)? 84\d(\.\d+)?\]/)
      })

      test.skipIf(Bun.which('gs') === null)(
        'does not contain the misspelled institution name',
        async () => {
          const process = Bun.spawn(
            [
              'gs',
              '-q',
              '-dNOPAUSE',
              '-dBATCH',
              '-sDEVICE=txtwrite',
              '-sOutputFile=-',
              fileURLToPath(pdfUrl),
            ],
            { stdout: 'pipe', stderr: 'pipe' },
          )
          const text = await new Response(process.stdout).text()
          await process.exited

          expect(text).toContain('I.E.S. El Rincón')
          expect(text).not.toContain('El Ricón')
        },
      )
    })
  }

  test('keeps the CV source HTML free of the misspelled institution name', () => {
    for (const locale of CV_LOCALES) {
      const html = readFileSync(
        new URL(`docs/cv/sergio-morales-${locale}.html`, projectRoot),
        'utf8',
      )
      expect(html).toContain('I.E.S. El Rincón')
      expect(html).not.toContain('El Ricón')
    }
  })

  test('no longer publishes the year-stamped CV copies', () => {
    for (const locale of CV_LOCALES) {
      expect(
        existsSync(
          new URL(`public/sergio-morales-2024-${locale}.pdf`, projectRoot),
        ),
      ).toBe(false)
    }
  })
})

const chromeAvailable = (() => {
  try {
    findChromeExecutable(process.env)
    return true
  } catch {
    return false
  }
})()

const cvHtmlPath = fileURLToPath(
  new URL('docs/cv/sergio-morales-en.html', projectRoot),
)

/** True while the pid exists and is not a zombie waiting to be reaped. */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
  } catch {
    return false
  }
  const state = Bun.spawnSync(['ps', '-o', 'stat=', '-p', String(pid)], {
    stdout: 'pipe',
    stderr: 'ignore',
  })
    .stdout.toString()
    .trim()
  return state !== '' && !state.startsWith('Z')
}

async function untilGone(pids: number[], timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (pids.some(isAlive) && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 20))
}

/** Safety net so a failing test never leaves a fake browser running. */
function killRecordedProcesses(directory: string): void {
  for (const name of ['main.pid', 'helper.pid']) {
    try {
      const pid = Number(readFileSync(join(directory, name), 'utf8'))
      if (!Number.isInteger(pid) || pid <= 1) continue
      // The browser leads its own process group; fall back to the bare pid.
      for (const target of [-pid, pid]) {
        try {
          process.kill(target, 'SIGKILL')
        } catch {}
      }
    } catch {}
  }
}

/**
 * Fake browser whose main process and a background helper both ignore SIGTERM
 * and hang; each records its pid so a test can check that nothing survives.
 */
async function writeGroupHangBrowser(directory: string): Promise<string> {
  const fakeBrowser = join(directory, 'fake browser')
  await writeFile(
    fakeBrowser,
    [
      '#!/bin/sh',
      "trap '' TERM",
      'dir=$(dirname "$0")',
      '( while :; do sleep 0.2; done ) &',
      'echo $! > "$dir/helper.pid"',
      'echo $$ > "$dir/main.pid"',
      'while :; do echo hung >&2; sleep 0.2; done',
      '',
    ].join('\n'),
    { mode: 0o755 },
  )
  return fakeBrowser
}

function recordedPids(directory: string): number[] {
  return ['main.pid', 'helper.pid'].map((name) =>
    Number(readFileSync(join(directory, name), 'utf8')),
  )
}

const signalNames = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

function signalListenerCounts(): number[] {
  return signalNames.map((name) => process.listenerCount(name))
}

/** Fake browser that honours `--print-to-pdf=` with a small valid PDF and exits 0. */
async function writeFakePrintingBrowser(directory: string): Promise<string> {
  const fixture = join(directory, 'fixture.pdf')
  await writeFile(fixture, buildSkiaLikePdf())
  const fakeBrowser = join(directory, 'fake browser')
  await writeFile(
    fakeBrowser,
    [
      '#!/bin/sh',
      'dir=$(dirname "$0")',
      'for arg in "$@"; do',
      '  case "$arg" in --print-to-pdf=*) out=${arg#--print-to-pdf=} ;; esac',
      'done',
      'cp "$dir/fixture.pdf" "$out"',
      '',
    ].join('\n'),
    { mode: 0o755 },
  )
  return fakeBrowser
}

describe('renderCvPdf', () => {
  test.skipIf(!chromeAvailable)(
    'renders an A4 PDF with the expected Info and no browser user agent',
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'cv-pdf-'))
      temporaryRoots.push(directory)
      const output = join(directory, 'cv.pdf')

      await renderCvPdf({
        tempRoot,
        htmlPath: fileURLToPath(
          new URL('docs/cv/sergio-morales-en.html', projectRoot),
        ),
        outputPath: output,
        chromePath: findChromeExecutable(process.env),
      })

      const pdf = await readFile(output)
      const structure = readPdfStructure(pdf)
      expect(structure.info.Title).toBe(infoToSet.title)
      expect(structure.info.Author).toBe(CV_AUTHOR)
      expect(structure.info.Creator).toBe(CV_AUTHOR)
      expect(pdf.toString('latin1')).not.toMatch(BROWSER_USER_AGENT_PATTERN)
      expect(structure.pageCount).toBe(1)
    },
    90_000,
  )

  test('rejects with a timeout error, escalating to SIGKILL, when the browser hangs', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv hang é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = join(directory, 'fake browser')
    // Ignores SIGTERM and keeps writing to stderr: only SIGKILL stops it.
    await writeFile(
      fakeBrowser,
      "#!/bin/sh\ntrap '' TERM\nwhile :; do echo hung >&2; sleep 0.2; done\n",
      { mode: 0o755 },
    )
    const output = join(directory, 'cv.pdf')
    const startedAt = Date.now()

    const failure = await renderCvPdf({
      tempRoot,
      htmlPath: fileURLToPath(
        new URL('docs/cv/sergio-morales-en.html', projectRoot),
      ),
      outputPath: output,
      chromePath: fakeBrowser,
      timeoutMs: 300,
      killGraceMs: 300,
    }).then(
      () => undefined,
      (error: unknown) => error,
    )

    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toMatch(/timed out after \d+ms/)
    expect((failure as Error).message).toContain(fakeBrowser)
    expect(Date.now() - startedAt).toBeLessThan(5_000)
    expect(existsSync(output)).toBe(false)
  }, 15_000)

  test('kills the whole browser process group on timeout, including helpers that ignore SIGTERM', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv group é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeGroupHangBrowser(directory)

    try {
      const failure = await renderCvPdf({
        tempRoot,
        htmlPath: cvHtmlPath,
        outputPath: join(directory, 'cv.pdf'),
        chromePath: fakeBrowser,
        timeoutMs: 1_000,
        killGraceMs: 300,
      }).then(
        () => undefined,
        (error: unknown) => error,
      )

      expect((failure as Error).message).toMatch(/timed out after \d+ms/)
      const mainPid = Number(readFileSync(join(directory, 'main.pid'), 'utf8'))
      const helperPid = Number(
        readFileSync(join(directory, 'helper.pid'), 'utf8'),
      )
      expect(Number.isInteger(mainPid) && mainPid > 1).toBe(true)
      expect(Number.isInteger(helperPid) && helperPid > 1).toBe(true)
      await untilGone([mainPid, helperPid])
      expect(isAlive(mainPid)).toBe(false)
      expect(isAlive(helperPid)).toBe(false)
    } finally {
      killRecordedProcesses(directory)
    }
  }, 15_000)

  test('keeps the timeout error when removing the temporary directory also fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv hang é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = join(directory, 'fake browser')
    await writeFile(
      fakeBrowser,
      "#!/bin/sh\ntrap '' TERM\nwhile :; do echo hung >&2; sleep 0.2; done\n",
      { mode: 0o755 },
    )
    const cleanupError = new Error('EBUSY: resource busy or locked')
    const removed: string[] = []

    const failure = await renderCvPdf({
      tempRoot,
      htmlPath: cvHtmlPath,
      outputPath: join(directory, 'cv.pdf'),
      chromePath: fakeBrowser,
      timeoutMs: 300,
      killGraceMs: 300,
      removeDirectory: async (path) => {
        removed.push(path)
        try {
          throw cleanupError
        } finally {
          await rm(path, { recursive: true, force: true })
        }
      },
    }).then(
      () => undefined,
      (error: unknown) => error,
    )

    expect(removed).toHaveLength(1)
    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toMatch(/timed out after \d+ms/)
    expect((failure as Error).cause).toBe(cleanupError)
  }, 15_000)

  test('surfaces a cleanup failure when nothing else went wrong', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv ok é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeFakePrintingBrowser(directory)
    const cleanupError = new Error('ENOTEMPTY: directory not empty')

    const failure = await renderCvPdf({
      tempRoot,
      htmlPath: cvHtmlPath,
      outputPath: join(directory, 'cv.pdf'),
      chromePath: fakeBrowser,
      removeDirectory: async (path) => {
        try {
          throw cleanupError
        } finally {
          await rm(path, { recursive: true, force: true })
        }
      },
    }).then(
      () => undefined,
      (error: unknown) => error,
    )

    expect(failure).toBe(cleanupError)
  }, 15_000)

  test('clears the stderr drain timer when the browser exits first', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv drain é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeFakePrintingBrowser(directory)
    const created = new Map<unknown, number>()
    const cleared = new Set<unknown>()
    const realSetTimeout = globalThis.setTimeout
    const realClearTimeout = globalThis.clearTimeout
    globalThis.setTimeout = ((
      handler: (...args: unknown[]) => void,
      delay?: number,
      ...args: unknown[]
    ) => {
      const handle = realSetTimeout(handler, delay, ...args)
      created.set(handle, delay ?? 0)
      return handle
    }) as typeof setTimeout
    globalThis.clearTimeout = ((
      handle?: Parameters<typeof clearTimeout>[0],
    ) => {
      cleared.add(handle)
      return realClearTimeout(handle)
    }) as typeof clearTimeout

    try {
      await renderCvPdf({
        tempRoot,
        htmlPath: cvHtmlPath,
        outputPath: join(directory, 'cv.pdf'),
        chromePath: fakeBrowser,
      })
    } finally {
      globalThis.setTimeout = realSetTimeout
      globalThis.clearTimeout = realClearTimeout
    }

    const drainTimers = [...created].filter(([, delay]) => delay === 1_000)
    expect(drainTimers).toHaveLength(1)
    for (const [handle] of drainTimers) expect(cleared.has(handle)).toBe(true)
  }, 15_000)

  test('creates the profile directory under the given tempRoot', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv root é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeFakePrintingBrowser(directory)
    const removed: string[] = []

    await renderCvPdf({
      tempRoot,
      htmlPath: cvHtmlPath,
      outputPath: join(directory, 'cv.pdf'),
      chromePath: fakeBrowser,
      removeDirectory: async (path) => {
        removed.push(path)
        await rm(path, { recursive: true, force: true })
      },
    })

    expect(removed).toHaveLength(1)
    expect(dirname(removed[0]!)).toBe(tempRoot)
    expect(basename(removed[0]!)).toStartWith('cv-chrome-')
    expect(chromeProfileDirectories()).toEqual([])
  }, 15_000)

  test('does not leak process signal listeners after a normal render', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv leak é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeFakePrintingBrowser(directory)
    const before = signalListenerCounts()

    await renderCvPdf({
      tempRoot,
      htmlPath: cvHtmlPath,
      outputPath: join(directory, 'cv.pdf'),
      chromePath: fakeBrowser,
    })

    expect(signalListenerCounts()).toEqual(before)
  }, 15_000)

  test('routes a failure of the process group kill into the rejection instead of an unhandled rejection', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv eperm é-'))
    temporaryRoots.push(directory)
    const fakeBrowser = await writeGroupHangBrowser(directory)
    const permissionError = Object.assign(new Error('EPERM: not permitted'), {
      code: 'EPERM',
    })
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    const before = signalListenerCounts()

    try {
      const failure = await renderCvPdf({
        tempRoot,
        htmlPath: cvHtmlPath,
        outputPath: join(directory, 'cv.pdf'),
        chromePath: fakeBrowser,
        timeoutMs: 1_000,
        killGraceMs: 300,
        killProcessGroup: () => {
          throw permissionError
        },
      }).then(
        () => undefined,
        (error: unknown) => error,
      )
      // Give a stray rejection the chance to surface.
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(failure).toBeInstanceOf(Error)
      expect((failure as Error).message).toMatch(/timed out after \d+ms/)
      expect((failure as Error).cause).toBe(permissionError)
      expect(unhandled).toEqual([])
      expect(signalListenerCounts()).toEqual(before)
    } finally {
      process.off('unhandledRejection', onUnhandled)
      killRecordedProcesses(directory)
    }
  }, 15_000)

  test('keeps forwarding SIGINT to the browser group while a timeout is still terminating it', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cv window é-'))
    temporaryRoots.push(directory)
    // The main process dies on SIGTERM but its helper ignores it, so `exited`
    // resolves while the group termination is still waiting out the grace period.
    const fakeBrowser = join(directory, 'fake browser')
    await writeFile(
      fakeBrowser,
      [
        '#!/bin/sh',
        'dir=$(dirname "$0")',
        '( trap "" TERM; while :; do sleep 0.2; done ) &',
        'echo $! > "$dir/helper.pid"',
        'echo $$ > "$dir/main.pid"',
        'while :; do echo hung >&2; sleep 0.2; done',
        '',
      ].join('\n'),
      { mode: 0o755 },
    )
    const runner = [
      `import { renderCvPdf } from ${JSON.stringify(fileURLToPath(new URL('./build-cv-pdfs.ts', import.meta.url)))}`,
      'await renderCvPdf({',
      '  htmlPath: process.env.CV_TEST_HTML!,',
      '  outputPath: process.env.CV_TEST_OUTPUT!,',
      '  chromePath: process.env.CV_TEST_BROWSER!,',
      '  tempRoot: process.env.CV_TEST_TEMP_ROOT!,',
      '  timeoutMs: 400,',
      '  killGraceMs: 15_000,',
      '})',
    ].join('\n')
    const runnerProcess = Bun.spawn([process.execPath, '-e', runner], {
      env: {
        ...process.env,
        CV_TEST_HTML: cvHtmlPath,
        CV_TEST_OUTPUT: join(directory, 'cv.pdf'),
        CV_TEST_BROWSER: fakeBrowser,
        CV_TEST_TEMP_ROOT: tempRoot,
      },
      stdout: 'ignore',
      stderr: 'ignore',
    })

    try {
      const deadline = Date.now() + 10_000
      while (
        !(
          existsSync(join(directory, 'main.pid')) &&
          existsSync(join(directory, 'helper.pid'))
        ) &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 20))
      const [mainPid, helperPid] = recordedPids(directory) as [number, number]
      expect(Number.isInteger(mainPid) && mainPid > 1).toBe(true)
      expect(Number.isInteger(helperPid) && helperPid > 1).toBe(true)

      // Wait for the timeout's SIGTERM to take the main process down while
      // the helper survives: the runner is now inside the termination wait.
      await untilGone([mainPid], 5_000)
      expect(isAlive(mainPid)).toBe(false)
      expect(isAlive(helperPid)).toBe(true)

      runnerProcess.kill('SIGINT')
      await runnerProcess.exited

      await untilGone([helperPid], 3_000)
      expect(isAlive(helperPid)).toBe(false)
    } finally {
      runnerProcess.kill('SIGKILL')
      killRecordedProcesses(directory)
    }
  }, 30_000)

  for (const [signal, exitCode] of [
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ] as const) {
    test(`kills the browser process group when the process receives ${signal}`, async () => {
      const directory = await mkdtemp(join(tmpdir(), 'cv signal é-'))
      temporaryRoots.push(directory)
      const fakeBrowser = await writeGroupHangBrowser(directory)
      const runner = [
        `import { renderCvPdf } from ${JSON.stringify(fileURLToPath(new URL('./build-cv-pdfs.ts', import.meta.url)))}`,
        'await renderCvPdf({',
        '  htmlPath: process.env.CV_TEST_HTML!,',
        '  outputPath: process.env.CV_TEST_OUTPUT!,',
        '  chromePath: process.env.CV_TEST_BROWSER!,',
        '  tempRoot: process.env.CV_TEST_TEMP_ROOT!,',
        '  tempRoot: process.env.CV_TEST_TEMP_ROOT!,',
        '})',
      ].join('\n')
      const runnerProcess = Bun.spawn([process.execPath, '-e', runner], {
        env: {
          ...process.env,
          CV_TEST_HTML: cvHtmlPath,
          CV_TEST_OUTPUT: join(directory, 'cv.pdf'),
          CV_TEST_BROWSER: fakeBrowser,
          CV_TEST_TEMP_ROOT: tempRoot,
        },
        stdout: 'ignore',
        stderr: 'ignore',
      })

      try {
        const deadline = Date.now() + 10_000
        while (
          !(
            existsSync(join(directory, 'main.pid')) &&
            existsSync(join(directory, 'helper.pid'))
          ) &&
          Date.now() < deadline
        )
          await new Promise((resolve) => setTimeout(resolve, 20))
        const pids = recordedPids(directory)
        expect(pids.every((pid) => Number.isInteger(pid) && pid > 1)).toBe(true)
        expect(pids.every(isAlive)).toBe(true)

        runnerProcess.kill(signal)
        await runnerProcess.exited

        // Terminated by the signal itself (re-raised) or with the conventional code.
        expect(
          runnerProcess.exitCode === exitCode ||
            runnerProcess.signalCode === signal,
        ).toBe(true)
        await untilGone(pids)
        expect(pids.some(isAlive)).toBe(false)
      } finally {
        runnerProcess.kill('SIGKILL')
        killRecordedProcesses(directory)
      }
    }, 20_000)
  }
})
