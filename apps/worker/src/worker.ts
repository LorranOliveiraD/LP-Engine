import 'dotenv/config' // Reload worker
import { Worker, Job } from 'bullmq'
import { redisConnection, BRIEFING_QUEUE_NAME, BriefingJobData, briefingQueue } from '@lp-engine/queue'
import { prisma } from '@lp-engine/database'
import { createLogger, baseLogger } from '@lp-engine/logger'
import { generateLandingPageContent } from '@lp-engine/ai'
import { assembleHtml } from './assembly'
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
  command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  args: ['--filter', '@lp-engine/mcp', 'exec', 'tsx', path.resolve(__dirname, '../../mcp/src/index.ts')],
  env: {
    ...process.env, // propaga todas as variáveis carregadas pelo dotenv
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
  }
})
const mcpClient = new Client({ name: 'worker-client', version: '1.0.0' }, { capabilities: {} })

mcpClient.connect(mcpTransport).then(() => {
  log.info('Servidor MCP conectado com sucesso')
}).catch((err) => {
  log.error('Falha na conexão com o MCP', { error: err.message })
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

  try {
    jobLog.info('Job iniciado', {
      event: 'job_started',
      attempt: job.attemptsMade + 1,
      objective,
      targetAudience,
      tone,
    })

    await prisma.briefing.update({
      where: { id: briefingId },
      data: { status: 'GENERATING' }
    })

    jobLog.info('Status atualizado para GENERATING', { event: 'status_changed', status: 'GENERATING' })

    // 1. Busca semântica (RAG) usando MCP Server Local
    jobLog.info('Conectando ao MCP Server para buscar histórico...', { event: 'mcp_connect' })
    let ragContext = 'Nenhum contexto histórico encontrado.'
    try {
      // Adiciona um timeout de 15 segundos para a busca no RAG
      const mcpResult = await Promise.race([
        mcpClient.callTool({
          name: 'query_knowledge_base',
          arguments: {
            query: `${objective} para ${targetAudience} tom ${tone}`,
            limit: 2
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MCP Timeout')), 15000))
      ]) as any
      
      ragContext = (mcpResult.content[0] as { text: string }).text
      jobLog.info('RAG concluído com sucesso', { event: 'mcp_success' })
    } catch (error) {
      jobLog.warn('Falha ao conectar no Servidor MCP ou RAG vazio/timeout', { 
        event: 'mcp_error', 
        error: (error as Error).message 
      })
      // Worker não deve falhar se o MCP estiver offline (resiliência)
    }

    // 2. Aciona o Gemini via package @lp-engine/ai
    jobLog.info('Gerando estrutura da Landing Page com Gemini Flash...', { event: 'ai_generation' })
    
    const lpType = job.data.type

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

    // 3. Page Assembly (JSON -> HTML)
    jobLog.info('Iniciando montagem do HTML (Assembly)...', { event: 'assembly_started' })
    await prisma.briefing.update({
      where: { id: briefingId },
      data: { status: 'ASSEMBLING' }
    })

    const htmlContent = assembleHtml(lpContent)
    jobLog.info('HTML montado com sucesso', { event: 'assembly_success' })

    // 4. Simulador de Deploy no Cloudflare
    jobLog.info('Iniciando deploy simulado no Cloudflare...', { event: 'deploy_started' })
    await prisma.briefing.update({
      where: { id: briefingId },
      data: { status: 'DEPLOYING' }
    })

    // Simula latência de rede/deploy (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const simulatedUrl = `https://preview.lp-engine.ai/lp/${briefingId.split('-')[0]}`
    jobLog.info('Deploy concluído (simulado)', { event: 'deploy_success', url: simulatedUrl })

    // 5. Salva no banco de dados na tabela LandingPage
    await prisma.landingPage.upsert({
      where: { briefingId },
      update: {
        content: lpContent,
        htmlOutput: htmlContent,
        previewUrl: simulatedUrl,
        status: 'PREVIEW',
        version: { increment: 1 }
      },
      create: {
        briefingId,
        content: lpContent,
        htmlOutput: htmlContent,
        previewUrl: simulatedUrl,
        status: 'PREVIEW',
        version: 1
      }
    })

    // Atualiza status final do Briefing
    await prisma.briefing.update({
      where: { id: briefingId },
      data: { status: 'PREVIEW_READY' }
    })

    const durationSeconds = (Date.now() - startTime) / 1000
    briefingJobDurationSeconds.observe(durationSeconds)

    jobLog.info('Job concluído com sucesso', {
      event: 'job_completed',
      durationSeconds,
      status: 'COMPLETED',
    })
  } catch (err) {
    const error = err as Error
    jobLog.error('ERRO CRÍTICO NO JOB:', {
      message: error.message,
      stack: error.stack,
      event: 'job_crash'
    })

    // IMPORTANTE: Atualiza o status do briefing para FAILED para que o usuário não fique esperando infinitamente
    try {
      await prisma.briefing.update({
        where: { id: briefingId },
        data: { status: 'FAILED' }
      })
      jobLog.info('Status do briefing atualizado para FAILED', { event: 'status_changed', status: 'FAILED' })
    } catch (dbErr) {
      jobLog.error('Erro ao tentar marcar briefing como FAILED no banco', { error: (dbErr as Error).message })
    }

    throw err // Importante dar o throw para o BullMQ saber que falhou
  }
}

const worker = new Worker<BriefingJobData>(
  BRIEFING_QUEUE_NAME,
  processBriefingJob,
  { connection: redisConnection, concurrency: 5 }
)

worker.on('ready', () => {
  log.info('Worker pronto e ouvindo a fila', { service: 'worker', queue: BRIEFING_QUEUE_NAME })
})

worker.on('completed', (job) => {
  briefingJobsProcessedTotal.inc()
  updateQueueSizeMetric()
  log.info('Job processado com sucesso', {
    event: 'worker_completed',
    jobId: String(job.id),
  })
})

worker.on('failed', (job, err) => {
  briefingJobsFailedTotal.inc()
  updateQueueSizeMetric()
  log.error('Falha no processamento do job', {
    event: 'job_failed',
    jobId: String(job?.id),
    attempt: job?.attemptsMade,
    error: err.message,
  })

  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    log.warn('Job movido para a Dead Letter Queue (DLQ)', {
      event: 'job_dlq',
      jobId: String(job.id),
      briefingId: job.data.briefingId,
    })
  }
})

worker.on('error', (err) => {
  log.error('Erro crítico no Worker', { event: 'worker_error', error: err.message })
})

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
