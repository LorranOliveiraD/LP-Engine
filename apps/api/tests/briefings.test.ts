import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest'
import { app } from '../src/server'
import { prisma } from '@lp-engine/database'

// Fazendo o mock (imitação) do nosso banco de dados Prisma para não poluir o banco real durante os testes
vi.mock('@lp-engine/database', () => ({
  prisma: {
    briefing: {
      create: vi.fn(),
    },
  },
}))

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
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'SAAS',
        objective: 'curto' // Menos de 10 caracteres propositalmente para o teste
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
        clientId: 'id-invalido-batata',
        type: 'SAAS',
        objective: 'Criar uma landing page incrível para o meu sistema'
      }
    })

    expect(response.statusCode).toBe(400)
  })

  test('Deve retornar 202 Accepted e salvar no banco quando o payload for válido', async () => {
    // Simulando que o Prisma salvou com sucesso e devolveu um ID
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
      payload: {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'SAAS',
        objective: 'Criar uma landing page incrível para o meu sistema'
      }
    })

    expect(response.statusCode).toBe(202)
    const payload = JSON.parse(response.payload)
    expect(payload).toEqual({
      status: 'accepted',
      briefingId: 'briefing-123',
      message: 'Briefing recebido e na fila de processamento'
    })

    // O Teste garante que a API chamou o banco de dados exatamente 1 vez
    expect(prisma.briefing.create).toHaveBeenCalledTimes(1)
  })
})
