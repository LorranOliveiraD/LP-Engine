import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

// Configuração Gemini (Apenas para Embeddings agora)
const rawGeminiKey = process.env.GEMINI_API_KEY || 'dummy_key'
const genAI = new GoogleGenerativeAI(rawGeminiKey.trim())
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' })

// Configuração Groq (Para Geração de Conteúdo)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Tipagem para os parâmetros de geração de LP
export interface GenerateLandingPageParams {
  objective: string
  targetAudience: string
  tone: string
  type: string
  ragContext?: string // Conteúdo similar recuperado do banco
}

/**
 * Gera a estrutura da Landing Page no formato JSON usando Groq (Llama 4).
 */
export async function generateLandingPageContent(params: GenerateLandingPageParams) {
  try {
    let prompt = `Você é um copywriter de elite especialista em criar Landing Pages de alta conversão.
Crie a copy para uma landing page do tipo: ${params.type}
Objetivo: ${params.objective}
Público-alvo: ${params.targetAudience}
Tom de voz: ${params.tone}

Retorne ESTRITAMENTE um objeto JSON válido seguindo exatamente esta estrutura:
{
  "design_tokens": {
    "primary_color": "hex code",
    "secondary_color": "hex code",
    "font_family": "serif ou sans-serif"
  },
  "headline": "título impactante",
  "subheadline": "subtítulo persuasivo",
  "cta": "texto do botão",
  "features": [
    {"title": "benefício 1", "description": "detalhe 1"},
    {"title": "benefício 2", "description": "detalhe 2"},
    {"title": "benefício 3", "description": "detalhe 3"}
  ],
  "testimonials": [
    {"name": "nome do cliente", "text": "depoimento curto", "role": "quem ele é"}
  ],
  "faq": [
    {"question": "pergunta comum", "answer": "resposta curta"}
  ],
  "guarantee": {
    "title": "título da garantia",
    "text": "texto sobre os dias de reembolso"
  }
}
`

    if (params.ragContext) {
      prompt += `\n<contexto_mcp>\nUse as seguintes landing pages de sucesso como INSPIRAÇÃO:\n${params.ragContext}\n</contexto_mcp>`
    }

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing. Retorne EXCLUSIVAMENTE um JSON válido com a estrutura da Landing Page. Não adicione nenhum texto antes ou depois do JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 1,
    });

    const jsonString = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro na geração com Groq:", error);
    throw error;
  }
}

/**
 * Gera embeddings para um texto usando o Gemini (que ainda tem cota).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
