import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
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

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  )
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

describe('renderCvPdf', () => {
  test.skipIf(!chromeAvailable)(
    'renders an A4 PDF with the expected Info and no browser user agent',
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'cv-pdf-'))
      temporaryRoots.push(directory)
      const output = join(directory, 'cv.pdf')

      await renderCvPdf({
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
})
