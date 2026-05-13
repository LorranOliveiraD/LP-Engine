const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("ERRO: Variável GEMINI_API_KEY não encontrada.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(key);

async function run() {
  try {
    const models = await genAI.listModels();
    console.log(JSON.stringify(models, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
