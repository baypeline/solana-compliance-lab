import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ApiFailure, createApiClient } from './client'

const server = setupServer()
const api = createApiClient({ baseUrl: 'http://localhost' })

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function failureOf(p: Promise<unknown>): Promise<ApiFailure> {
  try {
    await p
  } catch (e) {
    if (e instanceof ApiFailure) return e
    throw e
  }
  throw new Error('expected the call to fail')
}

describe('api client failures', () => {
  it('reports a proxy 502 without the contract error body as an unreachable Backend', async () => {
    server.use(http.get('*/api/v1/analyses/:id', () => new HttpResponse('', { status: 502, headers: { 'Content-Type': 'text/plain' } })))
    const f = await failureOf(api.getAnalysis('analysis-1'))
    expect(f.code).toBe('NETWORK_ERROR')
    expect(f.kind).toBe('network')
    expect(f.status).toBe(502)
    expect(f.retryable).toBe(true)
  })

  it('keeps any other status without the contract error body as an unstructured error', async () => {
    server.use(http.get('*/api/v1/analyses/:id', () => new HttpResponse('Invalid CORS request', { status: 403 })))
    const f = await failureOf(api.getAnalysis('analysis-1'))
    expect(f.code).toBe('UNSTRUCTURED_ERROR')
    expect(f.details).toEqual(['Invalid CORS request'])
    // the error box shows `message`, not `details`, so the raw text has to be in the message
    expect(f.message).toContain('Invalid CORS request')
  })
})
