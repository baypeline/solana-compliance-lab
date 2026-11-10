import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApiClient } from '../../api/client'
import { findScenario } from '../../contracts/catalog'
import { createMockBackend } from '../../mocks/backend'
import { renderPage } from '../../test/render'
import { NewCasePage } from '../NewCasePage'
import { initialForm } from './form'

const mock = createMockBackend({ queuedPolls: 1, runningPolls: 1 })
const server = setupServer(...mock.handlers)
const api = createApiClient({ baseUrl: 'http://localhost' })
let calls = 0
const count = () => void (calls += 1)

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  server.events.on('request:start', count)
})
beforeEach(() => {
  calls = 0
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  mock.reset()
})
afterAll(() => server.close())

const page = () => renderPage(<NewCasePage runOptions={{ pollIntervalMs: 0 }} />, { path: '/cases/new', at: '/cases/new', api })

describe('NewCasePage', () => {
  it('runs a fixture case and opens it', async () => {
    const { store } = page()
    fireEvent.change(screen.getByLabelText('Recipient scenario'), { target: { value: 'sanctioned' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run case' }))
    // a full run against the mock; allow for a loaded machine
    await waitFor(() => expect(screen.getAllByTestId('location').some((el) => el.textContent === '/cases/CL-0001')).toBe(true), { timeout: 10_000 })
    const saved = await store.get('CL-0001')
    expect(saved?.runs).toHaveLength(1)
    expect(saved?.runs[0].status).toBe('DONE')
    expect(saved?.runs[0].compliance?.decision.action).toBe('BLOCK')
  })

  it('rejects a malformed address before calling the API', async () => {
    page()
    fireEvent.click(screen.getByRole('radio', { name: 'Live on-chain' }))
    fireEvent.change(screen.getByLabelText('Sender address'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: findScenario('normal')!.request.address } })
    fireEvent.click(screen.getByRole('button', { name: 'Run case' }))
    expect(await screen.findByText('This is not a Solana address (Base58, 32–44 characters).')).toBeTruthy()
    expect(calls).toBe(0)
  })

  it('rejects an amount with more decimals than the asset has', async () => {
    page()
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '0.0000000001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run case' }))
    expect(await screen.findByText('SOL has at most 9 decimal places.')).toBeTruthy()
    expect(calls).toBe(0)
  })

  it('shows where a live run stopped and offers a retry', async () => {
    page()
    fireEvent.click(screen.getByRole('radio', { name: 'Live on-chain' }))
    fireEvent.change(screen.getByLabelText('Sender address'), { target: { value: findScenario('sender')!.request.address } })
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: findScenario('normal')!.request.address } })
    fireEvent.click(screen.getByRole('button', { name: 'Run case' }))
    expect(await screen.findByText('Stopped at: Sender wallet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  it('starts on the first scenario that is on offer', () => {
    expect(initialForm(new Date(), ['sender', 'demo-layering', 'sanctioned']).recipientFx).toBe('demo-layering')
    expect(initialForm(new Date(), ['sender', 'direct-flow', 'sanctioned']).recipientFx).toBe('direct-flow')
  })
})
