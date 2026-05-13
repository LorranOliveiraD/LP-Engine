import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const models = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro'
];

async function scan() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  for (const m of models) {
    console.log(`\n🔍 Testando modelo: ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Olá');
      console.log(`✅ Sucesso com ${m}! Resposta: ${result.response.text().substring(0, 20)}...`);
      return; // Para no primeiro que der certo
    } catch (err) {
      console.log(`❌ Falha com ${m}: ${err.message.substring(0, 50)}`);
    }
  }
}

scan();
