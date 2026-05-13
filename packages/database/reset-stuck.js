const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Reseta todos os briefings que ficaram travados em GENERATING
  const result = await prisma.briefing.updateMany({
    where: { status: 'GENERATING' },
    data: { status: 'PENDING' }
  });
  console.log(`Briefings resetados para PENDING: ${result.count}`);
  
  const all = await prisma.briefing.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Últimos 5:', all.map(b => ({ id: b.id.substring(0, 8), status: b.status, obj: b.objective.substring(0, 30) })));
}

run().finally(() => prisma.$disconnect());
