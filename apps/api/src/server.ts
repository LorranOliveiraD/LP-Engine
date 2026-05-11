import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { briefingRoutes } from './routes/briefings'

export const app = Fastify({
  logger: true
})

// Plugins de segurança
app.register(cors, { origin: '*' })
app.register(helmet)

// Rotas do sistema
app.register(briefingRoutes)

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
