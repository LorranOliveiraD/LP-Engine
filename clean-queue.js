const { Queue } = require('bullmq');

async function clean() {
  const q = new Queue('briefings', { 
    connection: { host: '127.0.0.1', port: 6379 } 
  });
  await q.obliterate({ force: true });
  console.log('Fila briefings obliterada com sucesso!');
  await q.close();
}

clean().catch(console.error);
