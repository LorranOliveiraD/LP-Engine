'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Briefing {
  id: string;
  status: string;
  type: string;
  objective: string;
  createdAt: string;
  client?: {
    name: string;
  };
}

export default function Home() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBriefings = async () => {
      try {
        const res = await fetch('http://localhost:3000/briefings')
        if (res.ok) {
          const json = await res.json()
          setBriefings(json.briefings)
        }
      } catch (err) {
        console.error('Erro ao buscar briefings', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBriefings()
    // Atualiza a lista a cada 5 segundos
    const interval = setInterval(fetchBriefings, 5000)
    return () => clearInterval(interval)
  }, [])

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
        <Link href="/briefings/new">
          <button className="button-primary">+ Novo Briefing</button>
        </Link>
      </header>

      <main>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
          Bem-vindo à Fábrica
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Acompanhe em tempo real as Landing Pages geradas pela inteligência artificial.
        </p>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando briefings do banco de dados...</p>
        ) : briefings.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Nenhum briefing encontrado</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Clique em &quot;Novo Briefing&quot; para criar sua primeira Landing Page com a IA.</p>
          </div>
        ) : (
          <div className="grid-layout">
            {briefings.map((item) => (
              <Link href={`/briefings/${item.id}`} key={item.id}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>{item.status}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    Campanha {item.type}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Objetivo: {item.objective.substring(0, 80)}{item.objective.length > 80 ? '...' : ''}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    Cliente: {item.client?.name || 'Desconhecido'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
