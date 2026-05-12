import IORedis from 'ioredis'

// Conexão compartilhada com o Redis
// maxRetriesPerRequest: null é obrigatório para o BullMQ funcionar corretamente
export const redisConnection = new IORedis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  }
)
