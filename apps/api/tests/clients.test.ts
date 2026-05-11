import { expect, test, describe, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { app } from '../src/server'
import { prisma } from '@lp-engine/database'

vi.mock('@lp-engine/database', () => ({
  prisma: {
    client: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Clientes CRUD', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Deve bloquear a criação se o email for inválido (Zod interceptando)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/clients',
      payload: {
        name: 'Matheus',
        email: 'email-errado-sem-arroba',
        niche: 'SaaS'
      }
    })

    expect(response.statusCode).toBe(400)
    const payload = JSON.parse(response.payload)
    expect(payload.message).toContain('Formato de email inválido')
  })

  test('Deve retornar 409 se o email já estiver cadastrado no banco', async () => {
    // Simulando que o Prisma achou o cliente
    vi.mocked(prisma.client.findUnique).mockResolvedValue({
      id: '123',
      name: 'Joao',
      email: 'joao@email.com',
      niche: 'Eventos',
      status: 'LEAD',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await app.inject({
      method: 'POST',
      url: '/clients',
      payload: {
        name: 'Matheus Novo',
        email: 'joao@email.com',
        niche: 'SaaS'
      }
    })

    expect(response.statusCode).toBe(409)
    const payload = JSON.parse(response.payload)
    expect(payload.error).toBe('Um cliente com esse email já existe.')
  })

  test('Deve criar o cliente e retornar 201 Created', async () => {
    // O Prisma nao acha ninguem com o email
    vi.mocked(prisma.client.findUnique).mockResolvedValue(null)
    
    // O Prisma cria com sucesso
    vi.mocked(prisma.client.create).mockResolvedValue({
      id: 'uuid-valido',
      name: 'Matheus',
      email: 'matheus@email.com',
      niche: 'SaaS',
      status: 'LEAD',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await app.inject({
      method: 'POST',
      url: '/clients',
      payload: {
        name: 'Matheus',
        email: 'matheus@email.com',
        niche: 'SaaS'
      }
    })

    expect(response.statusCode).toBe(201)
    const payload = JSON.parse(response.payload)
    expect(payload.id).toBe('uuid-valido')
    expect(payload.message).toBe('Cliente cadastrado com sucesso!')
  })
})
