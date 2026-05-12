import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest'
import { app } from '../src/server'
import { prisma } from '@lp-engine/database'
import { briefingQueue } from '@lp-engine/queue'

// Mock do banco de dados
vi.mock('@lp-engine/database', () => ({
  prisma: {
    briefing: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// Mock da fila BullMQ
vi.mock('@lp-engine/queue', () => ({
  briefingQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id-123' }),
  },
  briefingQueueEvents: { on: vi.fn(), close: vi.fn() },
  redisConnection: { on: vi.fn(), disconnect: vi.fn(), quit: vi.fn() },
}))

// Ciclo de vida único para todo o arquivo
beforeAll(async () => { await app.ready() })
afterAll(async () => { await app.close() })

const validPayload = {
  clientId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'SAAS',
  objective: 'Criar uma landing page incrível para o meu sistema',
  targetAudience: 'Jovens empreendedores de 20 a 35 anos',
  tone: 'CASUAL',
}

describe('POST /briefings - Intake Route', () => {
  test('Deve retornar erro 400 se o objetivo (objective) for muito curto', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/briefings',
      payload: { ...validPayload, objective: 'curto' }
    })
    expect(response.statusCode).toBe(400)
    const payload = JSON.parse(response.payload)
    expect(payload.message).toContain('O objetivo da landing page deve ser bem detalhado')
  })

  test('Deve retornar erro 400 se o clientId não for um UUID válido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/briefings',
      payload: { ...validPayload, clientId: 'id-invalido-batata' }
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
    expect(payload.status).toBe('accepted')
    expect(payload.briefingId).toBe('briefing-123')
    expect(payload.jobId).toBe('mock-job-id-123')

    expect(briefingQueue.add).toHaveBeenCalledWith('process-briefing', expect.objectContaining({
      briefingId: 'briefing-123',
      targetAudience: 'Jovens empreendedores de 20 a 35 anos',
      tone: 'CASUAL',
    }))
  })
})

describe('GET /briefings/:id/status - Status Route', () => {
  test('Deve retornar 404 se o briefing não existir', async () => {
    vi.mocked(prisma.briefing.findUnique).mockResolvedValue(null)

    const response = await app.inject({
      method: 'GET',
      url: '/briefings/briefing-inexistente/status',
    })

    expect(response.statusCode).toBe(404)
    const payload = JSON.parse(response.payload)
    expect(payload.error).toBe('Briefing não encontrado')
  })

  test('Deve retornar o status PENDING com mensagem correta', async () => {
    vi.mocked(prisma.briefing.findUnique).mockResolvedValue({
      id: 'briefing-456',
      status: 'PENDING',
      type: 'SAAS',
      objective: 'Criar uma landing page incrível',
      createdAt: new Date('2026-05-12T00:00:00Z'),
      updatedAt: new Date('2026-05-12T00:00:00Z'),
      client: { name: 'Lucas', email: 'lucas@teste.com' }
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/briefings/briefing-456/status',
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.status).toBe('PENDING')
    expect(payload.message).toContain('aguardando processamento')
    expect(payload.client.name).toBe('Lucas')
  })

  test('Deve retornar o status COMPLETED com mensagem de sucesso', async () => {
    vi.mocked(prisma.briefing.findUnique).mockResolvedValue({
      id: 'briefing-789',
      status: 'COMPLETED',
      type: 'ECOMMERCE',
      objective: 'Aumentar vendas no e-commerce',
      createdAt: new Date('2026-05-12T00:00:00Z'),
      updatedAt: new Date('2026-05-12T00:05:00Z'),
      client: { name: 'Maria', email: 'maria@loja.com' }
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/briefings/briefing-789/status',
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.payload)
    expect(payload.status).toBe('COMPLETED')
    expect(payload.message).toContain('Landing page gerada com sucesso')
  })
})
