import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { briefingRoutes } from './routes/briefings'
import { clientRoutes } from './routes/clients'
import {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from './metrics'

export const app = Fastify({ logger: true })

// Plugins de segurança
app.register(cors, { origin: '*' })
app.register(helmet)

// Setup da Documentação da API (Swagger/OpenAPI)
app.register(swagger, {
  swagger: {
    info: {
      title: 'LP Engine API',
      description: 'Documentação Oficial do Sistema Autônomo de Geração de Landing Pages',
      version: '1.0.0'
    },
    consumes: ['application/json'],
    produces: ['application/json']
  }
})

app.register(swaggerUi, { routePrefix: '/docs' })

// ── Hooks de métricas HTTP ────────────────────────────────────────────────────
app.addHook('onRequest', async (request) => {
  request.startTime = Date.now()
})

app.addHook('onResponse', async (request, reply) => {
  const duration = (Date.now() - (request.startTime ?? Date.now())) / 1000
  const route = request.routeOptions?.url ?? request.url
  const labels = {
    method: request.method,
    route,
    status_code: String(reply.statusCode),
  }
  httpRequestsTotal.inc(labels)
  httpRequestDurationSeconds.observe(labels, duration)
})

// Rotas do sistema
app.register(briefingRoutes)
app.register(clientRoutes)

// Rota de Health Check
app.get('/health', async () => {
  return { status: 'ok', message: 'LP Engine API is running' }
})

// Rota de Métricas (lida pelo Prometheus a cada 15s)
app.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', register.contentType)
  return reply.send(await register.metrics())
})

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Augment Fastify request type for startTime
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number
  }
}

if (require.main === module) {
  start()
}
