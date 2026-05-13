const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://localhost:6379');
const queue = new Queue('briefings', { connection });

async function run() {
  const active = await queue.getActive();
  const waiting = await queue.getWaiting();
  const delayed = await queue.getDelayed();
  const failed = await queue.getFailed();
  const completed = await queue.getCompleted();

  console.log('Active:', active.map(j => j.id));
  console.log('Waiting:', waiting.map(j => j.id));
  console.log('Delayed:', delayed.map(j => j.id));
  console.log('Failed:', failed.map(j => j.id));
  console.log('Completed:', completed.map(j => j.id));
  process.exit(0);
}

run();
