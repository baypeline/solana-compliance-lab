import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CasesProvider } from './CasesProvider'
import type { CasesValue } from './context'
import type { GatewaySimRecord } from './model'
import { createMemoryCaseStore } from './store'
import { fixtureCase } from './testCases'
import { useCases } from './useCases'

afterEach(cleanup)

function Probe({ onValue }: { onValue: (v: CasesValue) => void }) {
  onValue(useCases())
  return null
}

const record = (key: string): GatewaySimRecord => ({
  key,
  at: '2026-11-11T00:00:00.000Z',
  route: { routeId: key, policyEnforced: true, warningAcknowledged: false },
  result: null,
  error: null,
})

describe('CasesProvider.update', () => {
  it('applies two changes started from the same snapshot without losing either', async () => {
    const store = createMemoryCaseStore([fixtureCase('CL-0001', 'sanctioned')])
    let cases!: CasesValue
    render(
      <CasesProvider store={store}>
        <Probe onValue={(v) => (cases = v)} />
      </CasesProvider>,
    )
    await act(async () => {})
    const add = (key: string) =>
      cases.update('CL-0001', (c) => ({ ...c, runs: c.runs.map((r) => ({ ...r, gateway: [...r.gateway, record(key)] })) }))
    await act(async () => {
      await Promise.all([add('a'), add('b')])
    })
    const saved = (await store.list())[0]
    expect(saved.runs[0].gateway.map((g) => g.key)).toEqual(['a', 'b'])
  })
})
