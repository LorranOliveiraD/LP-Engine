import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { prisma } from '@lp-engine/database'
import { generateEmbedding } from '@lp-engine/ai'

const server = new Server({
  name: 'lp-engine-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
})

const queryKnowledgeBaseSchema = z.object({
  query: z.string().describe('O termo de busca ou objetivo da Landing Page para encontrar referências'),
  limit: z.number().optional().default(3).describe('Número máximo de referências para retornar'),
})

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_knowledge_base',
        description: 'Busca LPs e referências de copy na base de conhecimento usando busca semântica (RAG).',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Termo de busca ou objetivo' },
            limit: { type: 'number', description: 'Número máximo de referências (default: 3)' }
          },
          required: ['query']
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'query_knowledge_base') {
    const { query, limit } = request.params.arguments as z.infer<typeof queryKnowledgeBaseSchema>

    try {
      // 1. Gera o embedding da pergunta usando a API do Gemini
      const embedding = await generateEmbedding(query)
      const embeddingStr = `[${embedding.join(',')}]`

      // 2. Faz a busca vetorial (Cosine Distance) no Postgres
      // O operador <=> do pgvector retorna a distância coseno
      const results = await prisma.$queryRaw<Array<{ id: string; content: string; distance: number }>>`
        SELECT 
          id, 
          content,
          embedding <=> ${embeddingStr}::vector as distance
        FROM "embeddings"
        WHERE (embedding <=> ${embeddingStr}::vector) < 0.5
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `

      // 3. Formata os resultados para o Gemini ler
      const textResult = results.map(r => `Referência (Score: ${(1 - r.distance).toFixed(2)}):\n${r.content}`).join('\n\n')

      return {
        content: [
          {
            type: 'text',
            text: textResult || 'Nenhuma referência encontrada.'
          }
        ]
      }
    } catch (error: any) {
      console.error('Erro no RAG:', error)
      return {
        content: [
          {
            type: 'text',
            text: `Erro ao buscar na base de conhecimento: ${error.message}`
          }
        ],
        isError: true,
      }
    }
  }

  throw new Error('Tool não encontrada')
})

// Inicializa o servidor MCP via Stdio
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('🚀 Servidor MCP (LP Engine) iniciado!')
}

main().catch(console.error)
