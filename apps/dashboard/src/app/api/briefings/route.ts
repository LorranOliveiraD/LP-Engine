import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O servidor do Next.js chama a API interna
    const res = await fetch('http://127.0.0.1:3000/briefings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Erro ao comunicar com a API via Proxy' }, { status: 500 });
  }
}
