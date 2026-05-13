const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log('Ajustando dimensão da coluna embedding para 3072...');
    await prisma.$executeRawUnsafe('ALTER TABLE embeddings ALTER COLUMN embedding TYPE vector(3072);');
    console.log('Sucesso! Coluna atualizada.');
  } catch (e) {
    console.error('Erro ao atualizar coluna:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
