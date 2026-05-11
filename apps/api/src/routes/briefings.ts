import { FastifyInstance } from 'fastify'
import { BriefingSchema } from '@lp-engine/schemas'
import { prisma } from '@lp-engine/database'

export async function briefingRoutes(app: FastifyInstance) {
  app.post('/briefings', async (request, reply) => {
    // 1. O Porteiro (Zod): Valida o payload
    const parsed = BriefingSchema.safeParse(request.body)
    
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: parsed.error.errors[0].message,
        details: parsed.error.format()
      })
    }

    const data = parsed.data

    try {
      // 2. O Arquivista (Prisma): Salva no banco de dados com status PENDING
      const briefing = await prisma.briefing.create({
        data: {
          clientId: data.clientId,
          type: data.type,
          objective: data.objective,
          status: 'PENDING'
        }
      })

      // TODO: No futuro (Dia 11), aqui nós colocaremos o job na fila do BullMQ (Redis)

      // 3. A Resposta: 202 Accepted
      return reply.status(202).send({
        status: 'accepted',
        briefingId: briefing.id,
        message: 'Briefing recebido e na fila de processamento'
      })
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })
}
