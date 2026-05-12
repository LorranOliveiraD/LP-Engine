import { FastifyInstance } from 'fastify'
import { BriefingSchema } from '@lp-engine/schemas'
import { prisma } from '@lp-engine/database'
import { briefingQueue } from '@lp-engine/queue'

export async function briefingRoutes(app: FastifyInstance) {
  app.post('/briefings', {
    schema: {
      tags: ['Briefings'],
      summary: 'Enviar um novo briefing para processamento',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        required: ['clientId', 'type', 'objective', 'targetAudience', 'tone'],
        properties: {
          clientId: { type: 'string', description: 'UUID do cliente cadastrado (ex: 8c57fe30-d926-4da3-b07d-254e2dc5f869)' },
          type: { type: 'string', enum: ['SERVICO', 'ECOMMERCE', 'SAAS', 'EVENTO', 'PORTFOLIO'] },
          objective: { type: 'string', description: 'Objetivo da Landing Page (mín. 10 caracteres)' },
          targetAudience: { type: 'string', description: 'Público-alvo da campanha' },
          tone: { type: 'string', enum: ['FORMAL', 'CASUAL', 'TECNICO', 'INSPIRACIONAL'] }
        }
      }
    }
  }, async (request, reply) => {
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

      // 3. O Produtor (BullMQ): Publica o job na fila para o Worker processar
      await briefingQueue.add('process-briefing', {
        briefingId: briefing.id,
        clientId: briefing.clientId,
        objective: briefing.objective,
        targetAudience: data.targetAudience,
        tone: data.tone,
      })

      app.log.info(`📨 Job adicionado à fila para briefingId: ${briefing.id}`)

      // 4. A Resposta: 202 Accepted (imediata — o trabalho pesado é assíncrono)
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
