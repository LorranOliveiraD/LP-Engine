# Agentes IA no Gênesis — Substituindo o Breeze do HubSpot

---

## O Que o HubSpot Cobra Por Isso

O HubSpot vende essas funcionalidades via **créditos**:

| Agente | Custo HubSpot | O que faz |
|--------|--------------|-----------|
| **Customer Agent** | 50 créditos/conversa (US$ 0,45) | Chatbot IA que responde clientes |
| **Data Agent** | 10 créditos/execução (US$ 0,09) | Enriquece dados de contatos automaticamente |

> Preço: US$ 9,00 por 1.000 créditos. Com 200 conversas/mês + 500 enriquecimentos = **~US$ 135/mês** (~R$ 750/mês) **em cima** dos R$ 4.000 que já pagam.

### Nosso custo equivalente

| Agente | Custo Gênesis | Economia vs HubSpot |
|--------|--------------|---------------------|
| **Customer Agent** | ~R$ 0,15/conversa (Claude Haiku) | **70% mais barato** |
| **Data Agent** | ~R$ 0,05/enriquecimento | **45% mais barato** |
| **200 conversas + 500 enriquecimentos** | **~R$ 55/mês** | **-R$ 695/mês** |

---

## Agente 1 — Customer Agent (Atendimento Automático)

### O que faz
Um chatbot IA que fica **embutido nas LPs geradas** e/ou no site principal. Quando um visitante tem uma dúvida, o agente responde automaticamente com base nas informações do cliente.

### Como funciona

```
Visitante abre a LP → vê widget de chat no canto → digita pergunta
                                    ↓
              API Gênesis recebe a mensagem
                                    ↓
         RAG busca: dados do cliente + FAQ + info do serviço
                                    ↓
           Claude Haiku responde (rápido e barato)
                                    ↓
    Se não souber → escalona pra humano (notifica funcionário)
```

### Por que Claude Haiku e não Sonnet?
- **Haiku** = rápido (< 1 segundo) e barato (~R$ 0,15/conversa) → ideal pra chat
- **Sonnet** = mais inteligente mas mais lento e caro → ideal pra gerar LPs
- Cada tarefa usa o modelo certo

### O que o agente sabe responder (por cliente)
- Horário de funcionamento
- Serviços oferecidos e preços
- Localização e contato
- Perguntas frequentes do nicho
- Informações que estão na LP

### O que ele NÃO faz (e redireciona pra humano)
- Reclamações
- Negociações de preço
- Assuntos que não estão na base de conhecimento

### Como se encaixa na arquitetura

```
apps/api/src/
  agents/                          # ← NOVO módulo
    customer/
      chat.route.ts                # POST /api/chat/:clientId
      chat.service.ts              # Lógica: RAG → Claude Haiku → resposta
      knowledge-builder.ts         # Monta base de conhecimento por cliente
      escalation.ts                # Lógica de escalonamento pra humano
```

### Modelo de dados adicional

```
model ChatSession {
  id          String      @id
  clientId    String      → Client
  visitorId   String      // cookie anônimo
  messages    Message[]
  status      ACTIVE | ESCALATED | CLOSED
  resolvedByAI Boolean
  createdAt   DateTime
}

model Message {
  id          String
  sessionId   String      → ChatSession
  role        VISITOR | AGENT | HUMAN
  content     String
  createdAt   DateTime
}

model KnowledgeBase {
  id          String
  clientId    String      → Client
  entries     Json        // FAQ, serviços, horários
  embedding   vector(1536) // pra busca RAG
  updatedAt   DateTime
}
```

---

## Agente 2 — Data Agent (Enriquecimento de Dados)

### O que faz
Quando um novo contato é cadastrado no CRM com informações mínimas (nome + empresa), o Data Agent **busca automaticamente** dados públicos e preenche o resto.

### O que ele busca

| Dado | Fonte |
|------|-------|
| Segmento/nicho da empresa | Google, site da empresa |
| Endereço e telefone | Google Maps API |
| Redes sociais | Busca web |
| Descrição do negócio | Site da empresa |
| Número de funcionários (estimativa) | LinkedIn (dados públicos) |
| Avaliações / reputação | Google Reviews |

### Como funciona

```
Funcionário cadastra cliente (nome + empresa + cidade)
                        ↓
          BullMQ enfileira → data-enrichment
                        ↓
    Worker busca fontes públicas (Google, site, maps)
                        ↓
       Claude Haiku estrutura os dados encontrados
                        ↓
    Atualiza o cadastro do cliente automaticamente
                        ↓
  Funcionário vê: "✅ Dados enriquecidos" no perfil do cliente
```

### Como se encaixa na arquitetura

```
apps/api/src/
  agents/                          
    data/
      enrichment.worker.ts         # Worker BullMQ
      scrapers/
        google-search.ts           # Busca geral
        google-maps.ts             # Endereço, reviews
        website-crawler.ts         # Scraping do site da empresa
      structurer.ts                # Claude Haiku organiza os dados brutos
```

### Sem APIs caras — scraping inteligente

O HubSpot usa provedores de dados pagos (Clearbit, ZoomInfo). Nós usamos **fontes públicas gratuitas**:

| Fonte | Custo | Dado |
|-------|-------|------|
| Google Search (SerpAPI/Serper) | ~US$ 0,002/busca | Info geral da empresa |
| Google Maps (Places API) | Gratuito até 28k/mês | Endereço, telefone, reviews |
| Scraping do site | Gratuito | Descrição, serviços |
| Claude Haiku (estruturar) | ~US$ 0,01/chamada | Organiza tudo em JSON |

---

## Arquitetura Atualizada (Visão Completa)

```
lp-engine/
├── apps/api/src/
│   ├── routes/              # Endpoints REST
│   ├── orchestrator/        # Pipeline de geração de LP
│   ├── queues/              # BullMQ (filas + Bull Board)
│   ├── workers/             # Workers LP (intake, rag, generation, assembly, deploy)
│   ├── mcp/                 # MCP Servers (analytics, deploy)
│   ├── rag/                 # Pipeline RAG (embeddings, retriever)
│   ├── plugins/             # Fastify plugins
│   ├── agents/              # ← NOVO
│   │   ├── customer/        # Customer Agent (chatbot nas LPs)
│   │   └── data/            # Data Agent (enriquecimento automático)
│   └── server.ts
├── apps/dashboard/          # Next.js (CRM + gestão)
│   └── src/app/
│       ├── dashboard/
│       ├── clients/
│       ├── deals/           # ← NOVO: Pipeline de deals
│       ├── pages/
│       ├── chat/            # ← NOVO: Conversas do Customer Agent
│       └── queue/
├── packages/database/       # Prisma (schema atualizado)
└── infra/
```

---

## Prioridade de Implementação

Nem tudo precisa sair no dia 1. A ordem recomendada:

| Prioridade | Módulo | Justificativa |
|-----------|--------|---------------|
| 🔴 **P0** | CRM (clientes, deals, pipeline) | Base de tudo — substitui o HubSpot |
| 🔴 **P0** | Geração de LP com IA | O grande diferencial |
| 🟡 **P1** | Data Agent (enriquecimento) | Economiza tempo no cadastro — implementação simples |
| 🟢 **P2** | Customer Agent (chatbot) | Agrega valor mas pode vir depois |

### Cronograma revisado

| Fase | Entrega | Prazo |
|------|---------|-------|
| **Fase 1** | CRM + Pipeline de deals | 2 semanas |
| **Fase 2** | Geração de LP com IA | +2 semanas |
| **Fase 3** | Data Agent (enriquecimento automático) | +1 semana |
| **Fase 4** | Dashboard, permissões, métricas | +1 semana |
| **Fase 5** | Customer Agent (chatbot nas LPs) | +2 semanas |
| **Fase 6** | Migração do HubSpot + teste em paralelo | +1 semana |

> **Total: 8-9 semanas** para o sistema completo com os dois agentes.
> **Sem os agentes (só CRM + LP): 6-7 semanas** como antes.

---

## Resumo: HubSpot vs. Gênesis (Completo)

| Funcionalidade | HubSpot | Gênesis |
|---------------|---------|---------|
| CRM (clientes, deals) | ✅ | ✅ |
| Geração de LP com IA | ❌ | ✅ |
| Customer Agent (chatbot) | ✅ (50 créditos/conversa) | ✅ (**70% mais barato**) |
| Data Agent (enriquecimento) | ✅ (10 créditos/execução) | ✅ (**45% mais barato**) |
| Custo mensal (CRM + agentes) | **R$ 4.000 + R$ 750** | **~R$ 400** |
| Dados sob seu controle | ❌ | ✅ |
| Customizável | ❌ | ✅ |
| **Economia anual** | — | **~R$ 52.200** |
