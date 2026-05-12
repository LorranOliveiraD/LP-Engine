import 'dotenv/config'
import { Worker } from 'bullmq'
import { redisConnection, BRIEFING_QUEUE_NAME, BriefingJobData } from '@lp-engine/queue'
import { prisma } from '@lp-engine/database'

console.log('🚀 Worker iniciado — aguardando jobs na fila:', BRIEFING_QUEUE_NAME)

// O Worker fica "ouvindo" a fila e processa cada job que chegar
const worker = new Worker<BriefingJobData>(
  BRIEFING_QUEUE_NAME,
  async (job) => {
    const { briefingId, clientId, objective } = job.data

    console.log(`⚙️  [Job ${job.id}] Processando briefing: ${briefingId}`)
    console.log(`   → Cliente: ${clientId}`)
    console.log(`   → Objetivo: ${objective}`)

    // Por enquanto simulamos o trabalho com um delay (a IA virá na Semana 4)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Atualiza o status do briefing no banco de dados
    await prisma.briefing.update({
      where: { id: briefingId },
      data: { status: 'PROCESSING' }
    })

    console.log(`✅ [Job ${job.id}] Briefing ${briefingId} marcado como PROCESSING`)
  },
  {
    connection: redisConnection,
    concurrency: 5, // Processa até 5 briefings ao mesmo tempo
  }
)

// Eventos do ciclo de vida do job
worker.on('completed', (job) => {
  console.log(`🎉 [Job ${job.id}] Concluído com sucesso!`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Falhou:`, err.message)
})

// Graceful shutdown — fecha conexões limpamente ao encerrar o processo
process.on('SIGTERM', async () => {
  console.log('🛑 Worker encerrando...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})
