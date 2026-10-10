import type { Trace, TraceEvent } from 'lighthouse/types/artifacts.js'

const TEXT_LIMIT = 160
const SUMMARY_LIMIT = 12000
const text = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, TEXT_LIMIT) : null
const round = (value: number) => Math.round(value * 100) / 100
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}

export function traceResource(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  try {
    const url = new URL(value)
    // Data/blob/file URLs can carry content or local paths, not public resources.
    if (!['http:', 'https:'].includes(url.protocol))
      return '[non-http resource]'
    return `${url.origin}${url.pathname}`.slice(0, TEXT_LIMIT)
  } catch {
    return '[unresolved resource]'
  }
}

export function hasTraceEvents(value: unknown): value is Trace {
  return Array.isArray(record(value).traceEvents)
}

function frame(value: unknown) {
  const data = record(value)
  return {
    functionName: text(data.functionName),
    url: traceResource(data.url ?? data.scriptName),
    lineNumber: Number.isFinite(data.lineNumber) ? data.lineNumber : null,
    columnNumber: Number.isFinite(data.columnNumber) ? data.columnNumber : null,
  }
}

function directEvidence(event: TraceEvent) {
  const data = { ...record(event.args.beginData), ...record(event.args.data) }
  const frames = [
    data.callFrame,
    data,
    ...(Array.isArray(data.stackTrace) ? data.stackTrace : []),
  ]
    .map(frame)
    .filter((entry) => entry.functionName || entry.url)
    .slice(0, 3)
  const urls = [
    data.url,
    data.styleSheetUrl,
    data.scriptName,
    event.args.fileName,
  ]
    .map(traceResource)
    .filter((url): url is string => url !== null)
  return { directURLs: [...new Set(urls)].slice(0, 3), callFrames: frames }
}

function sampledFrames(events: TraceEvent[], timeOrigin: number) {
  // Resolve definitions across all Profile/ProfileChunk events, including those
  // before navigation. Sample time is Profile.startTime + cumulative timeDeltas,
  // not the timestamp of the chunk that delivers it (Lighthouse CpuProfileModel).
  const profiles = new Map<
    string,
    {
      nodes: Map<number, unknown>
      counts: Map<number, number>
      timestamp?: number
    }
  >()
  let sampleCount = 0
  let unresolvedSamples = 0
  let excludedBeforeNavigation = 0
  let unresolvedTimestamps = 0
  for (const event of events) {
    if (!['Profile', 'ProfileChunk'].includes(event.name)) continue
    const key = `${event.pid}/${event.tid}/${event.id}`
    let profile = profiles.get(key)
    if (!profile) {
      profile = { nodes: new Map(), counts: new Map() }
      profiles.set(key, profile)
    }
    const data = record(event.args.data)
    if (event.name === 'Profile')
      profile.timestamp =
        typeof data.startTime === 'number' && Number.isFinite(data.startTime)
          ? data.startTime
          : event.ts
    const cpu = record(data.cpuProfile)
    if (Array.isArray(cpu.nodes)) {
      for (const node of cpu.nodes) {
        if (Number.isInteger(record(node).id))
          profile.nodes.set(record(node).id as number, record(node).callFrame)
      }
    }
    if (!Array.isArray(cpu.samples)) continue
    const deltas = data.timeDeltas ?? cpu.timeDeltas
    if (!Array.isArray(deltas) || deltas.length !== cpu.samples.length)
      profile.timestamp = undefined
    for (const [index, id] of cpu.samples.entries()) {
      const delta = Array.isArray(deltas) ? deltas[index] : undefined
      if (profile.timestamp === undefined || !Number.isFinite(delta)) {
        profile.timestamp = undefined
        unresolvedTimestamps++
        continue
      }
      // Match Lighthouse's minimum 1µs delta for profiler clock anomalies.
      profile.timestamp += Math.max(delta, 1)
      if (profile.timestamp < timeOrigin) {
        excludedBeforeNavigation++
        continue
      }
      sampleCount++
      if (Number.isInteger(id))
        profile.counts.set(id, (profile.counts.get(id) ?? 0) + 1)
      else unresolvedSamples++
    }
  }
  const rows = []
  for (const profile of profiles.values()) {
    for (const [id, samples] of profile.counts) {
      if (!profile.nodes.has(id)) {
        unresolvedSamples += samples
        continue
      }
      rows.push({ ...frame(profile.nodes.get(id)), samples })
    }
  }
  return {
    sampleCount,
    unresolvedSamples,
    excludedBeforeNavigation,
    unresolvedTimestamps,
    rows: rows.sort((a, b) => b.samples - a.samples).slice(0, 6),
  }
}

export async function summarizeTrace(value: unknown) {
  const unavailable = (reason: string) => ({ status: 'unavailable', reason })
  if (!hasTraceEvents(value)) return unavailable('missing or malformed trace')
  if (!value.traceEvents.length) return unavailable('empty trace')
  if (
    value.traceEvents.some(
      (event) =>
        !event ||
        typeof event.name !== 'string' ||
        typeof event.cat !== 'string' ||
        typeof event.ph !== 'string' ||
        !Number.isFinite(event.ts) ||
        !Number.isFinite(event.pid) ||
        !Number.isFinite(event.tid) ||
        !event.args ||
        typeof event.args !== 'object' ||
        (event.dur !== undefined &&
          (!Number.isFinite(event.dur) || event.dur < 0)),
    )
  )
    return unavailable('malformed trace events')
  try {
    // Import and process only after the measured batch. These are the installed
    // Lighthouse task semantics, including paired B/E events and nested self time.
    const [{ TraceProcessor }, { MainThreadTasks }] = await Promise.all([
      import('lighthouse/core/lib/tracehouse/trace-processor.js'),
      import('lighthouse/core/lib/tracehouse/main-thread-tasks.js'),
    ])
    const processed = TraceProcessor.processTrace(value, {
      timeOriginDeterminationMethod: 'lastNavigationStart',
    })
    const tasks = MainThreadTasks.getMainThreadTasks(
      processed.mainThreadEvents,
      processed.frames,
      processed.timestamps.traceEnd,
      processed.timestamps.timeOrigin,
    ).filter((task) => task.endTime > 0)
    const reliability = new Map<(typeof tasks)[number], boolean>()
    const reliable = (task: (typeof tasks)[number]): boolean => {
      if (!reliability.has(task))
        reliability.set(
          task,
          !task.unbounded &&
            Number.isFinite(task.selfTime) &&
            task.selfTime >= 0 &&
            task.children.every(reliable),
        )
      return reliability.get(task)!
    }
    const row = (task: (typeof tasks)[number]) => ({
      name: text(task.event.name),
      group: task.group.id,
      startTimeMs: round(task.startTime),
      durationMs: round(task.duration),
      selfTimeMs: reliable(task) ? round(task.selfTime) : null,
      ...directEvidence(task.event),
    })
    const groups: Record<string, number> = {}
    for (const task of tasks) {
      if (reliable(task))
        groups[task.group.id] = (groups[task.group.id] ?? 0) + task.selfTime
    }
    const summary = {
      status: 'available',
      timing:
        'observed milliseconds relative to navigationStart; overlapping tasks retain full intervals (negative starts); no simulation scaling',
      eventCount: value.traceEvents.length,
      taskCount: tasks.length,
      unreliableSelfTimeCount: tasks.filter((task) => !reliable(task)).length,
      groups: Object.fromEntries(
        Object.entries(groups).map(([id, time]) => [id, round(time)]),
      ),
      rootTasks: tasks
        .filter((task) => !task.parent)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(row),
      selfWork: tasks
        .filter(reliable)
        .sort((a, b) => b.selfTime - a.selfTime)
        .slice(0, 12)
        .map(row),
      cpuSamples: sampledFrames(
        processed.mainThreadEvents,
        processed.timestamps.timeOrigin,
      ),
      limits: {
        rootTasks: 5,
        selfWork: 12,
        callFramesPerTask: 3,
        sampledFrames: 6,
        text: TEXT_LIMIT,
        characters: SUMMARY_LIMIT,
      },
      limitations: [
        'Direct event URLs/callframes only; no inherited or guessed task attribution.',
        'Self time excludes nested tasks; null if inferred task ends or invalid timing.',
        'CPU samples use startTime + timeDeltas; unknown timestamps are excluded. Counts and Other do not identify a cause.',
      ],
      truncated: false,
    }
    // Fixed row/string bounds plus a final serialized ceiling guard the CI log.
    while (JSON.stringify(summary).length > SUMMARY_LIMIT) {
      summary.truncated = true
      if (summary.selfWork.length) summary.selfWork.pop()
      else if (summary.cpuSamples.rows.length) summary.cpuSamples.rows.pop()
      else if (summary.rootTasks.length) summary.rootTasks.pop()
      else return unavailable('summary exceeds output limit')
    }
    return summary
  } catch {
    // Exceptions may embed raw trace URLs or contents. Keep them out of stdout.
    return unavailable(
      'trace processing failed; inspect the preserved local trace',
    )
  }
}
