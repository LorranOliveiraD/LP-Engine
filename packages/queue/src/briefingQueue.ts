import { Queue, QueueEvents } from 'bullmq'
import { redisConnection } from './redis'

// Nome da fila — centralizado para evitar typos nos outros packages
export const BRIEFING_QUEUE_NAME = 'briefings'

// A fila que a API usa para PUBLICAR jobs
export const briefingQueue = new Queue(BRIEFING_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,              // Tentará novamente até 3 vezes em caso de falha
    backoff: {
      type: 'exponential',    // Espera exponencial: 1s, 2s, 4s...
      delay: 1000,
    },
    removeOnComplete: 100,    // Mantém os 100 últimos jobs concluídos
    removeOnFail: 500,        // Mantém os 500 últimos jobs com falha para análise
  },
})

// Eventos da fila (usaremos para logs e métricas nos dias seguintes)
export const briefingQueueEvents = new QueueEvents(BRIEFING_QUEUE_NAME, {
  connection: redisConnection,
})

export type BriefingJobData = {
  briefingId: string
  clientId: string
  objective: string
  targetAudience: string
  tone: string
}
