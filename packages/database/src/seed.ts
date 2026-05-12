import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de embeddings no banco de dados...')

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
    // Mock de um vetor de 768 dimensões (padrão do Gemini Flash)
    const mockEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1)
    const embeddingStr = `[${mockEmbedding.join(',')}]`

    await prisma.$executeRaw`
      INSERT INTO "embeddings" (id, content, embedding, "sourceType", metadata, "createdAt")
      VALUES (gen_random_uuid(), ${t.content}, ${embeddingStr}::vector, CAST(${t.sourceType} AS "EmbeddingSource"), CAST(${JSON.stringify(t.metadata)} AS jsonb), now())
    `
  }
  
  const count = await prisma.$queryRaw`SELECT count(*) FROM "embeddings"`
  
  console.log(`✅ Seed concluído com sucesso. LPs de teste adicionadas: ${mockTemplates.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
