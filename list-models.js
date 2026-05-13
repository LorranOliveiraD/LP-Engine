const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = 'AIzaSyD64gd9tIJ1MoQ4NdaReBP7gKdHRDc4Ktk';
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
