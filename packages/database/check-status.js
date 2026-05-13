const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const briefings = await prisma.briefing.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(briefings);
}

run().finally(() => prisma.$disconnect());
