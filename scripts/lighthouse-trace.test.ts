import { describe, expect, test } from 'bun:test'
import type { Trace, TraceEvent } from 'lighthouse/types/artifacts.js'
import { summarizeTrace, traceResource } from './lighthouse-trace'

const navigation = 1000000
const url = 'https://user:password@example.com/index.html?private=token#secret'
function event(name: string, ts: number, dur?: number, data = {}): TraceEvent {
  return {
    name,
    ts,
    dur: dur ?? 0,
    cat: 'devtools.timeline',
    ph: dur === undefined ? 'I' : 'X',
    pid: 1,
    tid: 2,
    args: { data },
  }
}
function fixture(): Trace {
  return {
    traceEvents: [
      {
        ...event('TracingStartedInBrowser', navigation - 100),
        args: { data: { frames: [{ frame: 'main', processId: 1, url }] } },
      },
      {
        ...event('thread_name', navigation - 90),
        cat: '__metadata',
        ph: 'M',
        args: { name: 'CrRendererMain' },
      } as TraceEvent,
      event('navigationStart', navigation, undefined, {
        frame: 'main',
        documentLoaderURL: url,
        isLoadingMainFrame: true,
      }),
      event('RunTask', navigation + 10000, 120000),
      event('ParseHTML', navigation + 11000, 20000, { url }),
      event('ParseAuthorStyleSheet', navigation + 12000, 5000, {
        styleSheetUrl: 'https://example.com/styles.css?token=css#part',
      }),
      event('EvaluateScript', navigation + 32000, 50000, {
        url,
        lineNumber: 20,
      }),
      event('FunctionCall', navigation + 33000, 25000, {
        url,
        functionName: 'initLanguage',
        lineNumber: 21,
        columnNumber: 3,
        stackTrace: [{ functionName: 'caller', url }],
      }),
      { ...event('Layout', navigation + 83000), ph: 'B' },
      { ...event('Layout', navigation + 103000), ph: 'E' },
      {
        ...event('Profile', navigation + 35000),
        // Chrome's sample phase is omitted from Lighthouse's TraceEvent union.
        ph: 'P' as TraceEvent['ph'],
        id: 'profile',
        args: {
          data: {
            startTime: navigation + 35000,
            cpuProfile: {
              nodes: [
                { id: 1, callFrame: { functionName: 'initLanguage', url } },
              ],
            },
          },
        },
      },
      {
        ...event('ProfileChunk', navigation + 36000),
        // Chrome's sample phase is omitted from Lighthouse's TraceEvent union.
        ph: 'P' as TraceEvent['ph'],
        id: 'profile',
        args: {
          data: {
            cpuProfile: {
              samples: [1, 1, 1, 2],
              timeDeltas: [100, 100, 100, 100],
            },
          },
        },
      },
      { ...event('RunTask', navigation + 10000, 999000), pid: 9, tid: 9 },
      {
        ...event('Screenshot', navigation + 50000),
        args: { snapshot: 'SENSITIVE_SCREENSHOT' },
      },
    ],
  }
}

// Use primitive assertions so a failure cannot dump a large trace/DOM object.
describe('bounded observed Lighthouse trace evidence', () => {
  test('extracts main-thread tasks, paired events, self time and cross-chunk sampled callframes', async () => {
    const summary = await summarizeTrace(fixture())
    expect(summary.status).toBe('available')
    if (!('rootTasks' in summary)) throw new Error('missing trace evidence')
    expect(summary.rootTasks).toHaveLength(1)
    expect(summary.rootTasks[0].startTimeMs).toBe(10)
    expect(summary.rootTasks[0].durationMs).toBe(120)
    expect(summary.rootTasks[0].selfTimeMs).toBe(30)
    expect(summary.rootTasks[0].directURLs).toHaveLength(0)
    expect(
      summary.selfWork.find((row) => row.name === 'Layout')?.selfTimeMs,
    ).toBe(20)
    expect(
      summary.selfWork.find((row) => row.name === 'EvaluateScript')?.selfTimeMs,
    ).toBe(25)
    expect(
      summary.selfWork.find((row) => row.name === 'ParseHTML')?.selfTimeMs,
    ).toBe(15)
    expect(
      summary.selfWork.find((row) => row.name === 'ParseAuthorStyleSheet')
        ?.directURLs[0],
    ).toBe('https://example.com/styles.css')
    const call = summary.selfWork.find((row) => row.name === 'FunctionCall')
      ?.callFrames[0]
    expect(call?.functionName).toBe('initLanguage')
    expect(call?.url).toBe('https://example.com/index.html')
    expect(call?.lineNumber).toBe(21)
    expect(call?.columnNumber).toBe(3)
    expect(summary.cpuSamples.sampleCount).toBe(4)
    expect(summary.cpuSamples.unresolvedSamples).toBe(1)
    expect(summary.cpuSamples.rows[0].samples).toBe(3)
    expect(summary.cpuSamples.rows[0].functionName).toBe('initLanguage')
    expect(Object.values(summary.groups).reduce((sum, ms) => sum + ms, 0)).toBe(
      120,
    )
    const output = JSON.stringify(summary)
    for (const secret of [
      'password',
      'private=',
      'token=',
      '#secret',
      'SENSITIVE_SCREENSHOT',
    ])
      expect(output.includes(secret)).toBe(false)
    expect(summary.timing.includes('no simulation scaling')).toBe(true)
  })
  test.each([
    undefined,
    null,
    {},
    { traceEvents: null },
    { traceEvents: [] },
    { traceEvents: [null] },
    { traceEvents: [{}] },
    { traceEvents: [event('RunTask', NaN, 1)] },
  ])(
    'handles missing, empty and malformed input without exposing raw data',
    async (input) => {
      const summary = await summarizeTrace(input)
      expect(summary.status).toBe('unavailable')
      expect(JSON.stringify(summary).length).toBeLessThan(200)
    },
  )
  test.each(['Profile', 'ProfileChunk'])(
    'resolves %s definitions before navigation while counting samples by their own timestamps',
    async (definitionEvent) => {
      const trace = fixture()
      trace.traceEvents = trace.traceEvents.filter(
        (entry) => !['Profile', 'ProfileChunk'].includes(entry.name),
      )
      const node = {
        id: 7,
        callFrame: { functionName: 'beforeDefinedAfterCalled', url },
      }
      trace.traceEvents.push(
        {
          ...event('Profile', navigation - 1000),
          id: 'earlier',
          args: {
            data: {
              startTime: navigation - 1000,
              cpuProfile: {
                nodes: definitionEvent === 'Profile' ? [node] : [],
              },
            },
          },
        },
        {
          ...event('ProfileChunk', navigation - 900),
          id: 'earlier',
          args: {
            data: {
              cpuProfile: {
                nodes: definitionEvent === 'ProfileChunk' ? [node] : [],
              },
            },
          },
        },
        // The chunk is emitted after navigation, but its first sample precedes it.
        {
          ...event('ProfileChunk', navigation + 50000),
          id: 'earlier',
          args: {
            data: {
              cpuProfile: {
                samples: [7, 7, 7, 7],
                timeDeltas: [500, 600, 100, 100],
              },
            },
          },
        },
      )
      const summary = await summarizeTrace(trace)
      if (!('cpuSamples' in summary)) throw new Error('missing trace evidence')
      expect(summary.cpuSamples.sampleCount).toBe(3)
      expect(summary.cpuSamples.unresolvedSamples).toBe(0)
      expect(summary.cpuSamples.rows).toHaveLength(1)
      expect(summary.cpuSamples.rows[0].functionName).toBe(
        'beforeDefinedAfterCalled',
      )
      expect(summary.cpuSamples.rows[0].samples).toBe(3)
      expect(summary.cpuSamples.excludedBeforeNavigation).toBe(1)
      expect(summary.cpuSamples.unresolvedTimestamps).toBe(0)
    },
  )
  test('excludes samples with missing timing instead of attributing them to the page', async () => {
    const trace = fixture()
    const chunk = trace.traceEvents.find(
      (entry) => entry.name === 'ProfileChunk',
    )!
    chunk.args.data!.cpuProfile!.timeDeltas = []
    const summary = await summarizeTrace(trace)
    if (!('cpuSamples' in summary)) throw new Error('missing trace evidence')
    expect(summary.cpuSamples.sampleCount).toBe(0)
    expect(summary.cpuSamples.unresolvedTimestamps).toBe(4)
    expect(summary.cpuSamples.rows).toHaveLength(0)
  })
  test('keeps a root task crossing navigation and its whole self time without clipping', async () => {
    const trace = fixture()
    trace.traceEvents = trace.traceEvents.filter((entry) =>
      ['TracingStartedInBrowser', 'thread_name', 'navigationStart'].includes(
        entry.name,
      ),
    )
    trace.traceEvents.push(
      event('RunTask', navigation - 50, 101050),
      event('EvaluateScript', navigation + 1000, 50000, { url }),
      event('RunTask', navigation - 10000, 100),
    )
    const summary = await summarizeTrace(trace)
    if (!('rootTasks' in summary)) throw new Error('missing trace evidence')
    expect(summary.rootTasks).toHaveLength(1)
    expect(summary.rootTasks[0].name).toBe('RunTask')
    expect(summary.rootTasks[0].startTimeMs).toBe(-0.05)
    expect(summary.rootTasks[0].durationMs).toBe(101.05)
    expect(summary.rootTasks[0].selfTimeMs).toBe(51.05)
    expect(
      summary.selfWork.find((row) => row.name === 'EvaluateScript')?.selfTimeMs,
    ).toBe(50)
    expect(summary.taskCount).toBe(2)
  })
  test('reports unresolved navigation rather than guessing the thread or origin', async () => {
    const trace = fixture()
    trace.traceEvents = trace.traceEvents.filter(
      (event) => event.name !== 'navigationStart',
    )
    expect((await summarizeTrace(trace)).status).toBe('unavailable')
  })
  test('omits self time when a task end must be inferred', async () => {
    const trace = fixture()
    trace.traceEvents.push({
      ...event('IncompleteWork', navigation + 120000),
      ph: 'B',
    })
    const summary = await summarizeTrace(trace)
    if (!('rootTasks' in summary)) throw new Error('missing trace evidence')
    expect(summary.unreliableSelfTimeCount).toBeGreaterThan(0)
    expect(summary.rootTasks[0].selfTimeMs).toBeNull()
    expect(summary.selfWork.some((row) => row.name === 'IncompleteWork')).toBe(
      false,
    )
  })
  test('bounds rows, strings and total serialization without changing raw trace', async () => {
    const trace = fixture()
    const initial = trace.traceEvents.length
    for (let index = 0; index < 100; index++) {
      trace.traceEvents.push(
        event('RunTask', navigation + 200000 + index * 2000, 1900, {
          url,
          functionName: 'x'.repeat(1000),
          stackTrace: Array.from({ length: 50 }, () => ({
            functionName: 'y'.repeat(1000),
            url,
          })),
        }),
      )
    }
    const before = JSON.stringify(trace)
    const summary = await summarizeTrace(trace)
    if (!('rootTasks' in summary)) throw new Error('missing trace evidence')
    expect(summary.eventCount).toBe(initial + 100)
    expect(summary.rootTasks.length).toBeLessThanOrEqual(5)
    expect(summary.selfWork.length).toBeLessThanOrEqual(12)
    expect(summary.cpuSamples.rows.length).toBeLessThanOrEqual(6)
    expect(JSON.stringify(summary).length).toBeLessThanOrEqual(12000)
    for (const row of [...summary.rootTasks, ...summary.selfWork]) {
      expect(row.callFrames.length).toBeLessThanOrEqual(3)
      for (const frame of row.callFrames)
        expect((frame.functionName ?? '').length).toBeLessThanOrEqual(160)
    }
    expect(JSON.stringify(trace) === before).toBe(true)
  })
  test.each([
    [url, 'https://example.com/index.html'],
    [
      'https://example.com/font.woff2?key=private#x',
      'https://example.com/font.woff2',
    ],
    ['data:text/plain,private', '[non-http resource]'],
    ['blob:https://example.com/private', '[non-http resource]'],
    ['file:///Users/private/secret', '[non-http resource]'],
    ['//user:password@example.com/path?key=private', '[unresolved resource]'],
  ])('redacts resource %s', (input, expected) => {
    expect(traceResource(input)).toBe(expected)
  })
})
