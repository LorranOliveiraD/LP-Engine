import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest'
import { app } from '../src/server'
import { prisma } from '@lp-engine/database'

// Mock do banco de dados
vi.mock('@lp-engine/database', () => ({
  prisma: {
    briefing: {
      create: vi.fn(),
    },
  },
}))

// Mock da fila BullMQ — evita conexão real com Redis nos testes
vi.mock('@lp-engine/queue', () => ({
  briefingQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  },
  briefingQueueEvents: {
    on: vi.fn(),
    close: vi.fn(),
  },
  redisConnection: {
    on: vi.fn(),
    disconnect: vi.fn(),
    quit: vi.fn(),
  },
}))

const validPayload = {
  clientId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'SAAS',
  objective: 'Criar uma landing page incrível para o meu sistema',
  targetAudience: 'Jovens empreendedores de 20 a 35 anos',
  tone: 'CASUAL',
}

describe('POST /briefings - Intake Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Deve retornar erro 400 se o objetivo (objective) for muito curto', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/briefings',
      payload: {
        ...validPayload,
        objective: 'curto', // Menos de 10 caracteres propositalmente
      }
    })

    expect(response.statusCode).toBe(400)
    const payload = JSON.parse(response.payload)
    expect(payload.message).toContain('O objetivo da landing page deve ser bem detalhado')
  })

  test('Deve retornar erro 400 se o clientId não for um UUID válido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/briefings',
      payload: {
        ...validPayload,
        clientId: 'id-invalido-batata',
      }
    })

    expect(response.statusCode).toBe(400)
  })

  test('Deve retornar 202 Accepted e publicar job na fila quando o payload for válido', async () => {
    vi.mocked(prisma.briefing.create).mockResolvedValue({
      id: 'briefing-123',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'SAAS',
      objective: 'Criar uma landing page incrível para o meu sistema',
      status: 'PENDING',
      jobId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await app.inject({
      method: 'POST',
      url: '/briefings',
      payload: validPayload
    })

    expect(response.statusCode).toBe(202)
    const payload = JSON.parse(response.payload)
    expect(payload).toEqual({
      status: 'accepted',
      briefingId: 'briefing-123',
      message: 'Briefing recebido e na fila de processamento'
    })

    expect(prisma.briefing.create).toHaveBeenCalledTimes(1)
  })
})
