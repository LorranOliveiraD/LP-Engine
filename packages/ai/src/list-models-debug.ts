import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key || '');

async function run() {
  try {
    console.log('Listando modelos disponíveis para esta chave...');
    const result = await genAI.listModels();
    console.log('Modelos:', result.models.map(m => m.name));
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

run();
