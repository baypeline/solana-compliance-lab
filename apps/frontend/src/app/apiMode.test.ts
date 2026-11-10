import { demoScenarioIds } from '../contracts/catalog'
import { beforeEach, describe, expect, it } from 'vitest'
import { getModeOverride, resolveApiMode, scenariosFor, setModeOverride } from './apiMode'

beforeEach(() => localStorage.clear())

describe('API mode', () => {
  it('uses the build setting when nothing overrides it', () => {
    expect(resolveApiMode('backend', null)).toBe('backend')
  })

  it('lets a saved override win over the build setting', () => {
    expect(resolveApiMode('backend', 'mock')).toBe('mock')
  })

  it('defaults to mock', () => {
    expect(resolveApiMode(undefined, null)).toBe('mock')
  })

  it('remembers and clears the override', () => {
    expect(getModeOverride()).toBeNull()
    setModeOverride('mock')
    expect(getModeOverride()).toBe('mock')
    setModeOverride(null)
    expect(getModeOverride()).toBeNull()
  })

  it('offers the demo scenarios unless a Backend build says its collector does not have them', () => {
    const ids = (mode: 'mock' | 'backend', onBackend: boolean) => scenariosFor(mode, onBackend).map((x) => x.fixtureId)
    expect(ids('mock', false)).toEqual(expect.arrayContaining(demoScenarioIds))
    expect(ids('backend', true)).toEqual(expect.arrayContaining(demoScenarioIds))
    const hidden = ids('backend', false)
    expect(hidden.some((id) => demoScenarioIds.includes(id))).toBe(false)
    expect(hidden).toEqual(expect.arrayContaining(['sender', 'sanctioned']))
  })
})
