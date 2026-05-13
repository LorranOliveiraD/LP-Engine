import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'

const rawKey = process.env.GEMINI_API_KEY || 'dummy_key'
const apiKey = rawKey.trim()
const genAI = new GoogleGenerativeAI(apiKey)

// Usando o modelo descoberto via cURL: gemini-flash-latest
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

// Modelo de Embeddings padrão
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

// Tipagem para os parâmetros de geração de LP
export interface GenerateLandingPageParams {
  objective: string
  targetAudience: string
  tone: string
  type: string
  ragContext?: string // Conteúdo similar recuperado do banco
}

// O schema JSON que queremos que o Gemini retorne
const landingPageSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    headline: {
      type: SchemaType.STRING,
      description: 'Um título impactante e persuasivo (máx 12 palavras)',
    },
    subheadline: {
      type: SchemaType.STRING,
      description: 'Um subtítulo que explica a proposta de valor (máx 20 palavras)',
    },
    cta: {
      type: SchemaType.STRING,
      description: 'Texto do botão de Call to Action (ex: Comece Agora)',
    },
    features: {
      type: SchemaType.ARRAY,
      description: 'Lista de 3 a 4 benefícios ou características principais',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING }
        },
        required: ['title', 'description']
      }
    }
  },
  required: ['headline', 'subheadline', 'cta', 'features'],
}

/**
 * Gera a estrutura da Landing Page no formato JSON.
 */
export async function generateLandingPageContent(params: GenerateLandingPageParams) {
  let prompt = `Você é um copywriter de elite especialista em criar Landing Pages de alta conversão.
Crie a copy para uma landing page do tipo: ${params.type}
Objetivo: ${params.objective}
Público-alvo: ${params.targetAudience}
Tom de voz: ${params.tone}

Retorne ESTRITAMENTE o JSON com a estrutura da página.
`

  if (params.ragContext) {
    prompt += `\nUse as seguintes landing pages de sucesso como INSPIRAÇÃO (não copie, apenas adapte o estilo):\n${params.ragContext}`
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: landingPageSchema
    }
  })

  const text = result.response.text()
  return JSON.parse(text)
}

/**
 * Gera embeddings para um texto. Retorna um array de 768 floats.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
