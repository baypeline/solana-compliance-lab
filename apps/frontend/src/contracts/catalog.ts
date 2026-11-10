// contracts/ 아래의 Fixture·정책·규칙·모델 목록을 빌드 시점에 읽는다. 화면 선택지를 하드코딩하지 않기 위함이다.
import type { AnalysisRequest, ConstellationScenario } from '../api/types'

// Two sources of FIXTURE scenarios: the shared contract fixtures (one rule each, 0–3 transfers) and the frontend's own
// demo scenarios in apps/frontend/demo/fixtures (a day of activity each; results recorded from the real engines).
const analysisRequests = {
  ...import.meta.glob<AnalysisRequest>('@contracts/fixtures/*/analysis-request.json', { eager: true, import: 'default' }),
  ...import.meta.glob<AnalysisRequest>('../../demo/fixtures/*/analysis-request.json', { eager: true, import: 'default' }),
}
const policies = import.meta.glob<{ version: string }>('@contracts/config/policies/*.json', {
  eager: true,
  import: 'default',
})
const rulesets = import.meta.glob<RulesetConfig>('@contracts/config/rulesets/*.json', {
  eager: true,
  import: 'default',
})
const protocolModelFiles = import.meta.glob<ProtocolModels>('@contracts/config/protocol-models.json', {
  eager: true,
  import: 'default',
})

const constellationPublicRequest = import.meta.glob<{ scenario: ConstellationScenario }>(
  '@contracts/fixtures/constellation/public-request.json',
  { eager: true, import: 'default' },
)

const policyResponses = {
  ...import.meta.glob<{ decision: { action: string } }>('@contracts/fixtures/*/public-policy-response.json', { eager: true, import: 'default' }),
  ...import.meta.glob<{ decision: { action: string } }>('../../demo/fixtures/*/public-policy-response.json', { eager: true, import: 'default' }),
}

export interface RulesetRule {
  ruleVersion: string
  enabled: boolean
  score: number
  riskLevel: string
  windowSeconds?: number
  minRecipients?: number
  minTransactions?: number
}

export interface RulesetConfig {
  version: string
  highRiskThreshold: number
  rules: Record<string, RulesetRule>
}

export interface ProtocolModels {
  approvedVersions: string[]
  status: string
  mockVersion: string
}

export interface FixtureScenario {
  fixtureId: string
  request: AnalysisRequest
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((x) => Number.parseInt(x, 10))
  const pb = b.split(/[.-]/).map((x) => Number.parseInt(x, 10))
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return a.localeCompare(b)
}

/** Demo scenarios, in the order they are offered. */
export const demoScenarioIds = ['demo-layering', 'demo-burst', 'demo-busy-clean']
const rank = (id: string) => (id === 'sender' ? 0 : demoScenarioIds.includes(id) ? 1 + demoScenarioIds.indexOf(id) : 100)

/** FIXTURE 모드에서 고를 수 있는 시나리오. 공통 송신자(sender), 데모 시나리오, 계약 fixture 순서다. */
export const fixtureScenarios: FixtureScenario[] = Object.entries(analysisRequests)
  .map(([path, request]) => ({ fixtureId: path.split('/').at(-2) ?? path, request }))
  .filter((s) => s.request.fixtureId === s.fixtureId)
  .sort((a, b) => rank(a.fixtureId) - rank(b.fixtureId) || a.fixtureId.localeCompare(b.fixtureId))

export const policyVersions: string[] = Object.values(policies)
  .map((p) => p.version)
  .sort(compareSemver)

export const rulesetVersions: string[] = Object.values(rulesets)
  .map((r) => r.version)
  .sort(compareSemver)

export const protocolModels: ProtocolModels = Object.values(protocolModelFiles)[0] ?? {
  approvedVersions: [],
  status: 'UNKNOWN',
  mockVersion: '0.0.0-research-pending',
}

export function findScenario(fixtureId: string): FixtureScenario | undefined {
  return fixtureScenarios.find((s) => s.fixtureId === fixtureId)
}

/** Constellation 입력 기본값: contracts/fixtures/constellation/public-request.json의 시나리오 */
export const defaultConstellationScenario: ConstellationScenario = Object.values(constellationPublicRequest)[0]?.scenario ?? {
  proposerCount: 4,
  rejectingProposerCount: 1,
  submittedToAcceptingProposer: true,
  psliceAvailable: true,
  attestationPercent: 100,
  leaderAttemptsExclusion: true,
}

/** contracts/config/rulesets/{version}.json, read only (quoted in copy, never used to decide). */
export function rulesetConfig(version: string): RulesetConfig | undefined {
  return Object.values(rulesets).find((r) => r.version === version)
}

/** The decision stored in a fixture's public-policy-response.json, shown as "expected with fixture data". */
export function expectedDecision(fixtureId: string): string | undefined {
  const key = Object.keys(policyResponses).find((k) => k.split('/').at(-2) === fixtureId)
  return key ? policyResponses[key].decision.action : undefined
}
