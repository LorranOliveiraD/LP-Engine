import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { redisConnection, BRIEFING_QUEUE_NAME, BriefingJobData, briefingQueue } from '@lp-engine/queue'
import { prisma } from '@lp-engine/database'
import {
  briefingJobsProcessedTotal,
  briefingJobsFailedTotal,
  briefingQueueSize,
  briefingJobDurationSeconds,
} from './metrics'

console.log('🚀 Worker iniciado — aguardando jobs na fila:', BRIEFING_QUEUE_NAME)

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

  console.log(`⚙️  [Job ${job.id}] Processando briefing: ${briefingId}`)
  console.log(`   → Cliente ID: ${clientId}`)
  console.log(`   → Objetivo: ${objective}`)
  console.log(`   → Público-alvo: ${targetAudience}`)
  console.log(`   → Tom: ${tone}`)
  console.log(`   → Tentativa: ${job.attemptsMade + 1}`)

  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'PROCESSING' }
  })

  // Simulação do trabalho pesado — a IA Gemini virá na Semana 4
  console.log(`   → Simulando processamento assíncrono...`)

  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'COMPLETED' }
  })

  // Registra a duração do job nas métricas
  const durationSeconds = (Date.now() - startTime) / 1000
  briefingJobDurationSeconds.observe(durationSeconds)

  console.log(`✅ [Job ${job.id}] Briefing ${briefingId} concluído em ${durationSeconds.toFixed(2)}s!`)
}

const worker = new Worker<BriefingJobData>(
  BRIEFING_QUEUE_NAME,
  processBriefingJob,
  { connection: redisConnection, concurrency: 5 }
)

worker.on('completed', (job) => {
  console.log(`🎉 [Job ${job.id}] Concluído com sucesso!`)
  briefingJobsProcessedTotal.inc()
  updateQueueSizeMetric()
})

worker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Falhou (tentativa ${job?.attemptsMade}): ${err.message}`)
  briefingJobsFailedTotal.inc()
  updateQueueSizeMetric()

  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    console.error(`💀 [Job ${job.id}] Enviado para Dead Letter Queue.`)
  }
})

worker.on('error', (err) => {
  console.error('🔥 Erro crítico no Worker:', err.message)
})

const shutdown = async () => {
  console.log('🛑 Worker encerrando gracefully...')
  clearInterval(metricsInterval)
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
