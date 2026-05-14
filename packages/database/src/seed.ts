/**
 * @module Seed
 * Popula o banco de dados com dados iniciais de teste e embeddings de referência para RAG.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Alimentando o banco de dados...')

  const testClientId = '8c57fe30-d926-4da3-b07d-254e2dc5f869'
  await prisma.client.upsert({
    where: { id: testClientId },
    update: {},
    create: {
      id: testClientId,
      name: 'Cliente Gênesis Teste',
      email: 'teste@genesis.com',
      niche: 'Tecnologia',
      status: 'FECHADO'
    }
  })
  console.log('Cliente de teste criado.')

  const mockTemplates = [
    {
      content: 'Landing Page de SaaS focada em conversão rápida, com hero section em dark mode e botão de CTA verde. Ideal para startups tech.',
      sourceType: 'TEMPLATE',
      metadata: { tone: 'TECNICO', type: 'SAAS' },
    },
    {
      content: 'Página para e-commerce de moda com foco em fotos grandes, minimalismo, e fontes serifadas para sensação premium.',
      sourceType: 'TEMPLATE',
      metadata: { tone: 'INSPIRACIONAL', type: 'ECOMMERCE' },
    },
    {
      content: 'Portfolio para designer freelancer, destacando projetos recentes em cards interativos e formulário de contato direto.',
      sourceType: 'TEMPLATE',
      metadata: { tone: 'CASUAL', type: 'PORTFOLIO' },
    },
    {
      content: 'Página de vendas para consultoria de serviços corporativos, tom formal, depoimentos em carrossel e agendamento via Calendly.',
      sourceType: 'TEMPLATE',
      metadata: { tone: 'FORMAL', type: 'SERVICO' },
    }
  ]

  // Limpa os embeddings existentes para não duplicar no seed
  await prisma.$executeRaw`TRUNCATE TABLE "embeddings" RESTART IDENTITY;`

  for (const t of mockTemplates) {
    // Agora usando a IA real para gerar as coordenadas de significado do texto
    let mockEmbedding: number[]
    try {
      const { generateEmbedding } = require('@lp-engine/ai')
      mockEmbedding = await generateEmbedding(t.content)
    } catch (error: any) {
      console.error('Falha na API do Gemini:', error.message || error)
      console.warn('Fallback: Gerando embedding aleatorio (3072 dim). Defina GEMINI_API_KEY para embeddings reais.')
      mockEmbedding = Array.from({ length: 3072 }, () => Math.random() * 2 - 1)
    }

    const embeddingStr = `[${mockEmbedding.join(',')}]`

    await prisma.$executeRaw`
      INSERT INTO "embeddings" (id, content, embedding, "sourceType", metadata, "createdAt")
      VALUES (gen_random_uuid(), ${t.content}, ${embeddingStr}::vector, CAST(${t.sourceType} AS "EmbeddingSource"), CAST(${JSON.stringify(t.metadata)} AS jsonb), now())
    `
  }

  
  const count = await prisma.$queryRaw`SELECT count(*) FROM "embeddings"`
  
  console.log(`Seed finalizado. LPs de teste adicionadas: ${mockTemplates.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
