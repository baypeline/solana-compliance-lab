// Every enum value the contract can send must have a sentence. A missing one would render as a blank or a raw code.
import { describe, expect, it } from 'vitest'
import { en } from './en'

type Schema = { $defs: Record<string, { enum?: string[]; properties?: Record<string, { enum?: string[] }> }> }
const schemas = import.meta.glob<Schema>('@contracts/schemas/*.schema.json', { eager: true, import: 'default' })
function defs(file: string) {
  const key = Object.keys(schemas).find((k) => k.endsWith(`/${file}.schema.json`))
  if (!key) throw new Error(`schema ${file} not found`)
  return schemas[key].$defs
}
const enumOf = (file: string, def: string, prop?: string): string[] => {
  const d = defs(file)[def]
  const values = prop ? d.properties?.[prop]?.enum : d.enum
  if (!values) throw new Error(`no enum at ${file}/${def}${prop ? '.' + prop : ''}`)
  return values
}

const groups: [string, string[], Record<string, unknown>][] = [
  ['decision', enumOf('common', 'Action'), en.decision],
  ['level', enumOf('common', 'RiskLevel'), en.level],
  ['jobStatus', enumOf('common', 'JobStatus'), en.jobStatus],
  ['coverage', enumOf('common', 'CoverageReason'), en.coverage],
  ['error', enumOf('common', 'ErrorCode'), en.error],
  ['reason', enumOf('policy', 'ReasonCode'), en.reason],
  ['rule', enumOf('kyt', 'RuleId'), en.rule],
  ['evidence', enumOf('kyt', 'Evidence', 'type'), en.evidence],
  ['gateway.reason', enumOf('experiment', 'GatewayReason'), en.gateway.reason],
  ['gateway.outcome', enumOf('experiment', 'GatewayExperimentResult', 'outcome'), en.gateway.outcome],
  ['gateway.outcomeShort', enumOf('experiment', 'GatewayExperimentResult', 'outcome'), en.gateway.outcomeShort],
  ['network.outcome', enumOf('experiment', 'ConstellationSimulationResult', 'outcome'), en.network.outcome],
  ['network.explanation', enumOf('experiment', 'SimulationExplanation'), en.network.explanation],
  ['dataType', enumOf('common', 'DataProvenance', 'dataType'), en.dataType],
  ['labelSource', enumOf('collector', 'LabelDataset', 'source'), en.labelSource],
]

describe('copy dictionary covers the contract', () => {
  const cases = groups.flatMap(([group, values, dict]) => values.map((v) => [group, v, dict] as const))
  it.each(cases)('%s.%s has copy', (_group, value, dict) => {
    const entry = (dict as Record<string, unknown>)[value]
    expect(entry, `missing ${_group}.${value}`).toBeTruthy()
    const text = typeof entry === 'string' ? entry : JSON.stringify(entry)
    expect(text.trim().length).toBeGreaterThan(1)
  })

  it.each(['TIMEOUT', 'INTERRUPTED', 'NETWORK_ERROR', 'RESPONSE_CONTRACT_VIOLATION', 'RESPONSE_LINK_MISMATCH', 'UNSTRUCTURED_ERROR'])(
    'client-side error %s has copy',
    (code) => {
      expect((en.error as Record<string, unknown>)[code]).toBeTruthy()
    },
  )
})
