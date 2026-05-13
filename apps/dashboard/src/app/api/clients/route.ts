import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://127.0.0.1:3000/clients', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy Error (Clients):', error);
    return NextResponse.json({ error: 'Erro ao listar clientes via Proxy' }, { status: 500 });
  }
}
