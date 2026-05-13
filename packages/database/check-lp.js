const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const lp = await prisma.landingPage.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(lp);
}

run().finally(() => prisma.$disconnect());
