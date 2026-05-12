import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client'

export const register = new Registry()
register.setDefaultLabels({ app: 'lp-engine-worker' })

collectDefaultMetrics({ register })

export const briefingJobsProcessedTotal = new Counter({
  name: 'briefing_jobs_processed_total',
  help: 'Total de briefings processados com sucesso pelo Worker',
  registers: [register],
})

export const briefingJobsFailedTotal = new Counter({
  name: 'briefing_jobs_failed_total',
  help: 'Total de briefings que falharam no Worker',
  registers: [register],
})

export const briefingQueueSize = new Gauge({
  name: 'briefing_queue_size',
  help: 'Número atual de jobs aguardando na fila de briefings',
  registers: [register],
})

export const briefingJobDurationSeconds = new Histogram({
  name: 'briefing_job_duration_seconds',
  help: 'Duração do processamento de um job de briefing em segundos',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
})
