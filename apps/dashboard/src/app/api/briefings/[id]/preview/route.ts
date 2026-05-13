
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const res = await fetch(`http://127.0.0.1:3000/briefings/${id}/preview`, {
      headers: { 'Content-Type': 'text/html' },
    });

    if (!res.ok) {
      return new Response('Preview não disponível', { status: res.status });
    }

    const html = await res.text();
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Preview Proxy Error:', error);
    return new Response('Erro ao buscar preview via Proxy', { status: 500 });
  }
}
