import { describe, test, expect, vi, beforeEach } from 'vitest'
import { generateLandingPageContent, generateEmbedding } from '../src/gemini'

// Mock do SDK do Gemini
const { mockGenerateContent, mockEmbedContent, mockGroqCreate } = vi.hoisted(() => {
  return {
    mockGenerateContent: vi.fn(),
    mockEmbedContent: vi.fn(),
    mockGroqCreate: vi.fn(),
  }
})

vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockGroqCreate
        }
      }
    }))
  }
})

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockImplementation((config) => {
        if (config.model === 'gemini-embedding-2') {
          return { embedContent: mockEmbedContent }
        }
        return { generateContent: mockGenerateContent }
      })
    })),
    Schema: {},
    SchemaType: { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY' }
  }
})

describe('Integração Gemini Flash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Deve retornar a estrutura JSON correta para a Landing Page', async () => {
    const mockExpectedJson = {
      headline: 'Aumente suas vendas em 3x',
      subheadline: 'O sistema perfeito para escalar seu negócio.',
      cta: 'Assine Agora',
      features: [
        { title: 'Rápido', description: 'Alta performance' },
        { title: 'Seguro', description: 'Criptografia de ponta a ponta' }
      ]
    }

    mockGroqCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify(mockExpectedJson)
        }
      }]
    })
    
    const result = await generateLandingPageContent({
      objective: 'Vender meu novo SaaS de contabilidade',
      targetAudience: 'Contadores e pequenos escritórios',
      tone: 'FORMAL',
      type: 'SAAS'
    })

    expect(mockGroqCreate).toHaveBeenCalledTimes(1)
    
    const callArgs = mockGroqCreate.mock.calls[0][0]
    const promptText = callArgs.messages[1].content
    expect(promptText).toContain('Vender meu novo SaaS')
    expect(promptText).toContain('Contadores e pequenos escritórios')

    expect(result).toEqual(mockExpectedJson)
  })

  test('Deve gerar um embedding com 3072 dimensões', async () => {
    const mockVector = Array.from({ length: 3072 }, () => 0.5)
    
    mockEmbedContent.mockResolvedValue({
      embedding: { values: mockVector }
    })

    const result = await generateEmbedding('Texto de teste')

    expect(mockEmbedContent).toHaveBeenCalledWith('Texto de teste')
    expect(result).toHaveLength(3072)
    expect(result[0]).toBe(0.5)
  })
})
