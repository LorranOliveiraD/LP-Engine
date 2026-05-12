import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { redisConnection, BRIEFING_QUEUE_NAME, BriefingJobData, briefingQueue } from '@lp-engine/queue'
import { prisma } from '@lp-engine/database'
import { createLogger, baseLogger } from '@lp-engine/logger'
import { generateLandingPageContent } from '@lp-engine/ai'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'path'
import {
  briefingJobsProcessedTotal,
  briefingJobsFailedTotal,
  briefingQueueSize,
  briefingJobDurationSeconds,
  aiGenerationDurationSeconds,
} from './metrics'

// Logger raiz do Worker — todos os filhos herdarão o campo "service"
const log = createLogger({ service: 'worker' })

// Inicializa o Cliente MCP apontando para o nosso servidor MCP local
const mcpTransport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', path.resolve(__dirname, '../../mcp/src/index.ts')]
})
const mcpClient = new Client({ name: 'worker-client', version: '1.0.0' }, { capabilities: {} })

mcpClient.connect(mcpTransport).then(() => {
  log.info('Conectado ao Servidor MCP com sucesso!')
}).catch((err) => {
  log.error('Falha ao conectar no Servidor MCP', { error: err.message })
})

log.info('Worker iniciado', { queue: BRIEFING_QUEUE_NAME })

// Atualiza a métrica de tamanho da fila a cada 10 segundos
const updateQueueSizeMetric = async () => {
  const counts = await briefingQueue.getJobCounts('waiting', 'active')
  const total = (counts.waiting ?? 0) + (counts.active ?? 0)
  briefingQueueSize.set(total)
}

const metricsInterval = setInterval(updateQueueSizeMetric, 10_000)

// Função principal de processamento
export async function processBriefingJob(job: Job<BriefingJobData>): Promise<void> {
  const startTime = Date.now()
  const { briefingId, clientId, objective, targetAudience, tone } = job.data

  // Logger filho: cada log desta função carrega jobId, briefingId e clientId automaticamente
  const jobLog = createLogger({
    service: 'worker',
    jobId: String(job.id),
    briefingId,
    clientId,
  })

  jobLog.info('Job iniciado', {
    event: 'job_started',
    attempt: job.attemptsMade + 1,
    objective,
    targetAudience,
    tone,
  })

  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'PROCESSING' }
  })

  jobLog.info('Status atualizado para PROCESSING', { event: 'status_changed', status: 'PROCESSING' })

  jobLog.info('Buscando referências na base de conhecimento (RAG via MCP)...', { event: 'rag_search' })
  
  let ragContext = ''
  try {
    const mcpResult = await mcpClient.callTool({
      name: 'query_knowledge_base',
      arguments: {
        query: `${objective} para ${targetAudience} tom ${tone}`,
        limit: 2
      }
    })
    // Extrai o texto retornado pela ferramenta
    ragContext = (mcpResult.content[0] as { text: string }).text
    jobLog.info('Referências recuperadas com sucesso', { event: 'rag_success' })
  } catch (error: any) {
    jobLog.warn('Falha ao consultar Servidor MCP, usando RAG vazio', { event: 'rag_error', error: error.message })
  }

  jobLog.info('Gerando estrutura da Landing Page com Gemini Flash...', { event: 'ai_generation' })
  
  // Como `job.data.type` não está explicitamente no JobData atual, vamos fazer fallback
  const lpType = (job.data as any).type || 'SERVICO'

  const aiStartTime = Date.now()
  const lpContent = await generateLandingPageContent({
    objective,
    targetAudience,
    tone,
    type: lpType,
    ragContext
  })
  const aiDuration = (Date.now() - aiStartTime) / 1000
  aiGenerationDurationSeconds.observe(aiDuration)

  jobLog.info('Landing Page gerada com sucesso!', { event: 'ai_success', durationSeconds: aiDuration })

  // Salva no banco de dados na tabela LandingPage
  await prisma.landingPage.upsert({
    where: { briefingId },
    create: {
      briefingId,
      content: lpContent,
      status: 'DRAFT',
      version: 1
    },
    update: {
      content: lpContent,
      version: { increment: 1 }
    }
  })

  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'COMPLETED' }
  })

  const durationSeconds = (Date.now() - startTime) / 1000
  briefingJobDurationSeconds.observe(durationSeconds)

  jobLog.info('Job concluído com sucesso', {
    event: 'job_completed',
    durationSeconds,
    status: 'COMPLETED',
  })
}

const worker = new Worker<BriefingJobData>(
  BRIEFING_QUEUE_NAME,
  processBriefingJob,
  { connection: redisConnection, concurrency: 5 }
)

worker.on('completed', (job) => {
  briefingJobsProcessedTotal.inc()
  updateQueueSizeMetric()
  log.info('Job finalizado com sucesso pelo Worker', {
    event: 'worker_completed',
    jobId: String(job.id),
  })
})

worker.on('failed', (job, err) => {
  briefingJobsFailedTotal.inc()
  updateQueueSizeMetric()
  log.error('Job falhou', {
    event: 'job_failed',
    jobId: String(job?.id),
    attempt: job?.attemptsMade,
    error: err.message,
  })

  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    log.warn('Job esgotou todas as tentativas — movido para Dead Letter Queue', {
      event: 'job_dlq',
      jobId: String(job.id),
      briefingId: job.data.briefingId,
    })
  }
})

worker.on('error', (err) => {
  log.error('Erro crítico no Worker', { event: 'worker_error', error: err.message })
})

const shutdown = async () => {
  log.info('Worker encerrando gracefully...', { event: 'shutdown' })
  clearInterval(metricsInterval)
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
