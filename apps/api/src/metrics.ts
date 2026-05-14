import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client'

// Registry isolado para evitar conflito entre instâncias (API vs Worker vs Testes)
export const register = new Registry()
register.setDefaultLabels({ app: 'lp-engine' })

// Coleta métricas padrão do Node.js (CPU, memória, event loop lag, etc.)
collectDefaultMetrics({ register })

// ── Métricas da API ───────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP recebidas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

// ── Métricas do Worker ────────────────────────────────────────────────────────

export const briefingJobsProcessedTotal = new Gauge({
  name: 'briefing_jobs_processed_total',
  help: 'Total de briefings processados com sucesso pelo Worker',
  registers: [register],
})

export const briefingJobsFailedTotal = new Gauge({
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
