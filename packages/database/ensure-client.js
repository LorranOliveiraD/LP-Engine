const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  let client = await prisma.client.findFirst();
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Default Client',
        email: 'default@example.com'
      }
    });
  }
  console.log(client.id);
}

run().finally(() => prisma.$disconnect());
