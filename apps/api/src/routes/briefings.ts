import { FastifyInstance } from 'fastify'
import { BriefingSchema } from '@lp-engine/schemas'
import { prisma } from '@lp-engine/database'
import { briefingQueue } from '@lp-engine/queue'

export async function briefingRoutes(app: FastifyInstance) {
  // ── POST /briefings ──────────────────────────────────────────────
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
          clientId: { type: 'string', description: 'UUID do cliente cadastrado' },
          type: { type: 'string', enum: ['SERVICO', 'ECOMMERCE', 'SAAS', 'EVENTO', 'PORTFOLIO'] },
          objective: { type: 'string', description: 'Objetivo da Landing Page (mín. 10 caracteres)' },
          targetAudience: { type: 'string', description: 'Público-alvo da campanha' },
          tone: { type: 'string', enum: ['FORMAL', 'CASUAL', 'TECNICO', 'INSPIRACIONAL'] }
        }
      }
    }
  }, async (request, reply) => {
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
      const briefing = await prisma.briefing.create({
        data: {
          clientId: data.clientId,
          type: data.type,
          objective: data.objective,
          status: 'PENDING'
        }
      })

      const job = await briefingQueue.add('process-briefing', {
        briefingId: briefing.id,
        clientId: briefing.clientId,
        objective: briefing.objective,
        targetAudience: data.targetAudience,
        tone: data.tone,
      }, {
        attempts: 5, // Tenta até 5 vezes se a API do Gemini falhar (Rate Limit)
        backoff: {
          type: 'exponential',
          delay: 2000 // Tenta de novo em 2s, depois 4s, 8s, 16s, 32s
        }
      })

      app.log.info(`📨 Job ${job.id} adicionado à fila para briefingId: ${briefing.id}`)

      return reply.status(202).send({
        status: 'accepted',
        briefingId: briefing.id,
        jobId: job.id,
        message: 'Briefing recebido e na fila de processamento'
      })
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })

  // ── GET /briefings/:id/status ─────────────────────────────────────
  app.get('/briefings/:id/status', {
    schema: {
      tags: ['Briefings'],
      summary: 'Consultar o status de processamento de um briefing',
      produces: ['application/json'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID do briefing' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const briefing = await prisma.briefing.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          type: true,
          objective: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: { name: true, email: true }
          }
        }
      })

      if (!briefing) {
        return reply.status(404).send({ error: 'Briefing não encontrado' })
      }

      const statusMessages: Record<string, string> = {
        PENDING: 'Briefing na fila, aguardando processamento...',
        PROCESSING: 'Worker está processando seu briefing agora...',
        COMPLETED: 'Landing page gerada com sucesso!',
        FAILED: 'Ocorreu um erro no processamento. Tente novamente.',
      }

      return reply.send({
        briefingId: briefing.id,
        status: briefing.status,
        message: statusMessages[briefing.status] || 'Status desconhecido',
        type: briefing.type,
        objective: briefing.objective,
        client: briefing.client,
        createdAt: briefing.createdAt,
        updatedAt: briefing.updatedAt,
      })
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })
}
