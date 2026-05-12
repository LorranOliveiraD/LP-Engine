import winston from 'winston'

const isDev = process.env.NODE_ENV !== 'production'

// Formato para desenvolvimento: colorido e legível por humanos
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level}] ${message}${metaStr}`
  })
)

// Formato para produção: JSON puro — pesquisável por Datadog, CloudWatch, Loki, etc.
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Logger base — outros módulos criam "filhos" com contexto adicional
export const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
})

/**
 * Cria um logger filho com contexto estático pré-definido.
 * Todos os logs emitidos por ele carregarão os campos extras automaticamente.
 *
 * @example
 * const log = createLogger({ service: 'worker', jobId: '123', briefingId: 'abc' })
 * log.info('Processando')  // → { service: 'worker', jobId: '123', briefingId: 'abc', message: 'Processando' }
 */
export function createLogger(context: Record<string, string>) {
  return baseLogger.child(context)
}

export { winston }
