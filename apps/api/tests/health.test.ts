import { expect, test, describe, beforeAll, afterAll } from 'vitest'
import { app } from '../src/server'

describe('Health Check Endpoint', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  test('GET /health returns 200 and status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })

    expect(response.statusCode).toBe(200)
    
    const payload = JSON.parse(response.payload)
    expect(payload).toEqual({
      status: 'ok',
      message: 'LP Engine API is running'
    })
  })
})
