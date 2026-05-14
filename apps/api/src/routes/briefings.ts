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
    app.log.info({ body: request.body }, 'Recebendo novo briefing')
    const parsed = BriefingSchema.safeParse(request.body)

    if (!parsed.success) {
      app.log.warn({ errors: parsed.error.format() }, 'Erro de validação no briefing')
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
        type: briefing.type,
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

      // Salva o jobId no banco para podermos rastrear o status real da fila
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { jobId: job.id }
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

  // ── GET /briefings ────────────────────────────────────────────────
  app.get('/briefings', {
    schema: {
      tags: ['Briefings'],
      summary: 'Listar todos os briefings recentes',
      produces: ['application/json']
    }
  }, async (request, reply) => {
    try {
      const briefings = await prisma.briefing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          type: true,
          objective: true,
          createdAt: true,
          client: { select: { name: true } }
        }
      })
      return reply.send({ briefings })
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
          },
          landingPage: {
            select: { previewUrl: true }
          }
        }
      })

      if (!briefing) {
        return reply.status(404).send({ error: 'Briefing não encontrado' })
      }

      const statusMessages: Record<string, string> = {
        PENDING: 'Briefing na fila, aguardando processamento...',
        GENERATING: 'O Gemini está criando o conteúdo da sua página...',
        ASSEMBLING: 'O Engine está montando o HTML e CSS premium...',
        DEPLOYING: 'Publicando sua página no Cloudflare...',
        PREVIEW_READY: 'Landing page gerada com sucesso!',
        FAILED: 'Ocorreu um erro no processamento. Tente novamente.',
      }

      return reply.send({
        briefingId: briefing.id,
        status: briefing.status,
        message: statusMessages[briefing.status] || 'Status desconhecido',
        type: briefing.type,
        objective: briefing.objective,
        client: briefing.client,
        previewUrl: briefing.landingPage?.previewUrl || null,
        createdAt: briefing.createdAt,
        updatedAt: briefing.updatedAt,
      })
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })

  // ── GET /briefings/:id/preview ────────────────────────────────────
  app.get('/briefings/:id/preview', {
    schema: {
      tags: ['Briefings'],
      summary: 'Ver o HTML gerado da Landing Page',
      produces: ['text/html'],
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
      const landingPage = await prisma.landingPage.findUnique({
        where: { briefingId: id },
        select: { htmlOutput: true }
      })

      if (!landingPage || !landingPage.htmlOutput) {
        return reply.status(404).send('<html><body><h1>Landing Page não encontrada ou ainda não processada.</h1></body></html>')
      }

      reply.header('Content-Type', 'text/html; charset=utf-8')
      return reply.send(landingPage.htmlOutput)
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send('Erro interno ao carregar preview')
    }
  })
}
