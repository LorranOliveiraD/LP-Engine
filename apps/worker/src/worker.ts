import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { redisConnection, BRIEFING_QUEUE_NAME, BriefingJobData } from '@lp-engine/queue'
import { prisma } from '@lp-engine/database'

console.log('🚀 Worker iniciado — aguardando jobs na fila:', BRIEFING_QUEUE_NAME)

// Função principal de processamento (separada para facilitar testes)
export async function processBriefingJob(job: Job<BriefingJobData>): Promise<void> {
  const { briefingId, clientId, objective, targetAudience, tone } = job.data

  console.log(`⚙️  [Job ${job.id}] Processando briefing: ${briefingId}`)
  console.log(`   → Cliente ID: ${clientId}`)
  console.log(`   → Objetivo: ${objective}`)
  console.log(`   → Público-alvo: ${targetAudience}`)
  console.log(`   → Tom: ${tone}`)
  console.log(`   → Tentativa: ${job.attemptsMade + 1} de ${job.opts.attempts}`)

  // Atualiza o status para PROCESSING (o cliente sabe que está sendo trabalhado)
  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'PROCESSING' }
  })

  // Simulação do trabalho pesado — a IA Gemini virá na Semana 4
  console.log(`   → Simulando processamento assíncrono...`)

  // Atualiza o status para COMPLETED
  await prisma.briefing.update({
    where: { id: briefingId },
    data: { status: 'COMPLETED' }
  })

  console.log(`✅ [Job ${job.id}] Briefing ${briefingId} concluído!`)
}

// O Worker fica ouvindo a fila e chama processBriefingJob para cada job
const worker = new Worker<BriefingJobData>(
  BRIEFING_QUEUE_NAME,
  processBriefingJob,
  {
    connection: redisConnection,
    concurrency: 5,
  }
)

// ── Eventos do ciclo de vida ─────────────────────────────────────────────────

worker.on('completed', (job) => {
  console.log(`🎉 [Job ${job.id}] Concluído com sucesso!`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Falhou (tentativa ${job?.attemptsMade}): ${err.message}`)

  // Se esgotou todas as tentativas, o job vai para a Dead Letter Queue (DLQ)
  // automaticamente pelo BullMQ — configurado com removeOnFail: false no package/queue
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    console.error(`💀 [Job ${job.id}] Enviado para Dead Letter Queue após ${job.attemptsMade} tentativas.`)
  }
})

worker.on('error', (err) => {
  console.error('🔥 Erro crítico no Worker:', err.message)
})

// ── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🛑 Worker encerrando gracefully...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 Worker encerrando gracefully...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})
