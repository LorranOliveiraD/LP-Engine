fetch('http://localhost:3000/briefings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: '8c57fe30-d926-4da3-b07d-254e2dc5f869',
    type: 'ECOMMERCE',
    objective: 'Testando a recuperacao do worker',
    targetAudience: 'Geral',
    tone: 'CASUAL'
  })
}).then(res => res.json()).then(console.log).catch(console.error);
