import 'dotenv/config';
import { generateLandingPageContent } from '@lp-engine/ai';

async function test() {
  console.log('🚀 Iniciando teste do Gemini...');
  console.log('Chave carregada:', process.env.GEMINI_API_KEY ? 'Sim' : 'Não');
  
  try {
    const start = Date.now();
    const content = await generateLandingPageContent({
      objective: 'Vender curso de culinária',
      targetAudience: 'Hobbistas',
      tone: 'INSPIRACIONAL',
      type: 'ECOMMERCE'
    });
    
    console.log('✅ Sucesso! Tempo:', (Date.now() - start) / 1000, 's');
    console.log('Conteúdo:', JSON.stringify(content, null, 2));
  } catch (err) {
    console.error('❌ Erro no Gemini:', err);
  }
}

test();
