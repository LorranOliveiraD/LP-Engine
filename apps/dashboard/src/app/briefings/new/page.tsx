'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
}

export default function NewBriefing() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'SAAS',
    objective: '',
    targetAudience: '',
    tone: 'TECNICO'
  })

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients')
        if (res.ok) {
          const data = await res.json()
          setClients(data.clients || [])
          if (data.clients?.length > 0) {
            setFormData(prev => ({ ...prev, clientId: data.clients[0].id }))
          }
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
      }
    }
    loadClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId) {
      alert('Por favor, selecione um cliente.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const json = await res.json()
        router.push(`/briefings/${json.briefingId}`)
      } else {
        const error = await res.json()
        alert(`Erro: ${error.message || 'Erro desconhecido'}`)
        setLoading(false)
      }
    } catch (err) {
      console.error('🔥 [FETCH ERROR]:', err)
      alert(`Falha ao comunicar com a API: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo-text">Gênesis LP Engine</div>
        <Link href="/" className="button-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }}>
          Cancelar
        </Link>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card">
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Novo Briefing</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
            Descreva a Landing Page que você deseja criar com IA.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cliente</label>
              <select 
                required
                value={formData.clientId} 
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white' }}
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Página</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white' }}
              >
                <option value="SAAS">SaaS B2B</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="SERVICO">Página de Serviços</option>
                <option value="EVENTO">Captura para Evento</option>
                <option value="PORTFOLIO">Portfólio</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Objetivo Principal</label>
              <textarea 
                required
                minLength={10}
                placeholder="Ex: Vender assinaturas do meu software de gestão financeira..."
                value={formData.objective} 
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', minHeight: '100px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Público-alvo</label>
              <input 
                required
                type="text"
                placeholder="Ex: Empreendedores e contadores"
                value={formData.targetAudience} 
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tom de Voz da Copy</label>
              <select 
                value={formData.tone} 
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white' }}
              >
                <option value="TECNICO">Técnico e Direto</option>
                <option value="FORMAL">Corporativo e Formal</option>
                <option value="CASUAL">Descontraído e Casual</option>
                <option value="INSPIRACIONAL">Inspiracional e Emocional</option>
              </select>
            </div>

            <button type="submit" className="button-primary" disabled={loading} style={{ marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Enviando...' : 'Gerar Landing Page'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
