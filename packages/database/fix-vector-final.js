const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log('Limpando tabela de embeddings e ajustando dimensão...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE embeddings CASCADE;');
    await prisma.$executeRawUnsafe('ALTER TABLE embeddings ALTER COLUMN embedding TYPE vector(3072);');
    console.log('Sucesso! Banco de dados atualizado para os modelos de 2026.');
  } catch (e) {
    console.error('Erro ao atualizar banco:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
