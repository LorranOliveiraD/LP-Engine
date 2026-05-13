import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const res = await fetch(`http://127.0.0.1:3000/briefings/${id}/status`, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Status Proxy Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar status via Proxy' }, { status: 500 });
  }
}
