import { FastifyInstance } from 'fastify'
import { ClientSchema } from '@lp-engine/schemas'
import { prisma } from '@lp-engine/database'

export async function clientRoutes(app: FastifyInstance) {
  app.post('/clients', {
    schema: {
      tags: ['Clientes'],
      summary: 'Cadastrar um novo cliente',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        required: ['name', 'email', 'niche'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          niche: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Usando validação manual e segura do Zod (sem conflito de bibliotecas)
    const parsed = ClientSchema.safeParse(request.body)
    
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: parsed.error.errors[0].message
      })
    }

    const data = parsed.data

    // Verifica se já existe um cliente com esse email
    const existingClient = await prisma.client.findUnique({
      where: { email: data.email }
    })

    if (existingClient) {
      return reply.status(409).send({ error: 'Um cliente com esse email já existe.' })
    }

    // Salva o cliente
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        niche: data.niche,
        status: 'LEAD'
      }
    })

    return reply.status(201).send({
      id: client.id,
      message: 'Cliente cadastrado com sucesso!'
    })
  })

  app.get('/clients', async (request, reply) => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return reply.send({ clients })
  })
}
