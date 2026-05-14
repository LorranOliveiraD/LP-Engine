'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface BriefingData {
  status: string;
  message: string;
  briefingId: string;
  type: string;
  objective: string;
  client?: {
    name: string;
  };
}

export default function BriefingStatus({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  
  const [data, setData] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Polling a cada 3 segundos
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/briefings/${id}/status`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Erro ao buscar status', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2>Carregando status...</h2>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <h2>Briefing não encontrado.</h2>
        <Link href="/" className="button-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Voltar</Link>
      </div>
    )
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-pending'
      case 'GENERATING': return 'status-processing'
      case 'PREVIEW_READY': return 'status-completed'
      case 'FAILED': return 'status-failed'
      default: return ''
    }
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo-text">LP Engine</div>
        <Link href="/" className="button-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }}>
          Voltar ao Dashboard
        </Link>
      </header>

      <main>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className={`status-badge ${getStatusClass(data.status)}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem', marginBottom: '1.5rem' }}>
              {data.status}
            </span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{data.message === 'Status desconhecido' && data.status === 'GENERATING' ? 'Worker está processando seu briefing agora...' : data.message}</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Briefing ID: {data.briefingId}</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Detalhes da Campanha</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Tipo</p>
                <p style={{ fontWeight: 600 }}>{data.type}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Cliente</p>
                <p style={{ fontWeight: 600 }}>{data.client?.name || 'Desconhecido'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Objetivo</p>
                <p>{data.objective}</p>
              </div>
            </div>
          </div>

          {data.status === 'PREVIEW_READY' && (
            <div style={{ textAlign: 'center' }}>
              <a 
                href={`/api/briefings/${id}/preview`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="button-primary" 
                style={{ display: 'block', width: '100%', padding: '1rem', textDecoration: 'none', textAlign: 'center' }}
              >
                Pré-visualizar Landing Page
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
