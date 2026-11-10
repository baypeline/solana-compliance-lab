// Moving cases between browsers as a JSON file, e.g. to prepare the demo laptop (design doc §9).
import { newCaseId, type CaseRecord } from './model'
import { validateCaseRecord } from './store'

const FORMAT = 'scl-cases'
const VERSION = 1

export function exportCases(records: CaseRecord[]): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), cases: records }, null, 2)
}

export function parseCaseExport(text: string): { ok: true; cases: CaseRecord[] } | { ok: false; error: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not JSON.' }
  }
  if (data === null || typeof data !== 'object') return { ok: false, error: 'The file is not a case export.' }
  const d = data as { format?: unknown; version?: unknown; cases?: unknown }
  if (d.format !== FORMAT) return { ok: false, error: 'The file is not a Compliance Lab case export.' }
  if (d.version !== VERSION) return { ok: false, error: `Unsupported export version ${String(d.version)}.` }
  if (!Array.isArray(d.cases)) return { ok: false, error: 'The file has no case list.' }
  for (const c of d.cases) {
    const errs = validateCaseRecord(c)
    if (errs.length > 0) return { ok: false, error: `A case could not be read: ${errs[0]}` }
  }
  return { ok: true, cases: d.cases as CaseRecord[] }
}

/** Imported cases keep their content; an id that is already taken gets the next free id. */
export function mergeImported(existing: CaseRecord[], incoming: CaseRecord[]): CaseRecord[] {
  const out = [...existing]
  for (const c of incoming) {
    const taken = out.some((x) => x.id === c.id)
    out.push(taken ? { ...c, id: newCaseId(out) } : c)
  }
  return out
}
