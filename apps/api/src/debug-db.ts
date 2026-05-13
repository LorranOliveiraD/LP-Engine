import { prisma } from '@lp-engine/database';

async function main() {
  const id = '881d505a-1cd7-4ecc-9749-ff1efa18b828';
  const briefing = await prisma.briefing.findUnique({
    where: { id },
    include: { landingPage: true }
  });
  console.log(JSON.stringify(briefing, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
