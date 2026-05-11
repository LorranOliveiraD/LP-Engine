import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { briefingRoutes } from './routes/briefings'
import { clientRoutes } from './routes/clients'

export const app = Fastify({
  logger: true
})

// Plugins de segurança
app.register(cors, { origin: '*' })
app.register(helmet)

// Setup da Documentação da API (Swagger/OpenAPI)
app.register(swagger, {
  openapi: {
    info: {
      title: 'LP Engine API',
      description: 'Documentação Oficial do Sistema Autônomo de Geração de Landing Pages',
      version: '1.0.0'
    },
  }
})

app.register(swaggerUi, {
  routePrefix: '/docs',
})

// Rotas do sistema
app.register(briefingRoutes)
app.register(clientRoutes)

// Rota de Health Check (Monitoramento)
app.get('/health', async () => {
  return { status: 'ok', message: 'LP Engine API is running' }
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

// Só inicia o servidor se não estiver rodando em ambiente de testes
if (require.main === module) {
  start()
}
