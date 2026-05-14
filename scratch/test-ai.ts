import 'dotenv/config'
import { generateLandingPageContent } from './packages/ai/src/gemini'

async function test() {
  console.log('Testing AI generation...')
  try {
    const result = await generateLandingPageContent({
      objective: 'Vender um curso de culinária italiana',
      targetAudience: 'Iniciantes',
      tone: 'INSPIRACIONAL',
      type: 'ECOMMERCE'
    })
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
