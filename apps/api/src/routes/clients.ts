import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ClientSchema } from '@lp-engine/schemas'
import { prisma } from '@lp-engine/database'
import { z } from 'zod'

export async function clientRoutes(fastify: FastifyInstance) {
  // Ativando a tipagem forte do Zod nesta rota
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post('/clients', {
    schema: {
      tags: ['Clientes'],
      summary: 'Cadastrar um novo cliente',
      description: 'Recebe os dados básicos e cadastra o cliente para gerar briefings futuros.',
      body: ClientSchema,
      response: {
        201: z.object({
          id: z.string().uuid(),
          message: z.string()
        }),
        400: z.object({
          error: z.string()
        }),
        409: z.object({
          error: z.string()
        })
      }
    }
  }, async (request, reply) => {
    const data = request.body

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

  app.get('/clients', {
    schema: {
      tags: ['Clientes'],
      summary: 'Listar todos os clientes'
    }
  }, async (request, reply) => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return reply.send(clients)
  })
}
