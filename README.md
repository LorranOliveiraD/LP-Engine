# LP Engine 🏭

> **Plataforma industrial para geração automatizada de Landing Pages de alta conversão**, orquestrada por IA Generativa, RAG e Model Context Protocol. Substitui fluxos manuais lentos por uma fábrica assíncrona que entrega uma LP completa — copy, design e publicação — em ~10 segundos.

[![CI/CD](https://github.com/LorranOliveiraD/LP-Engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/LorranOliveiraD/LP-Engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white)](./terraform)

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do Monorepo](#estrutura-do-monorepo)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Infraestrutura (IaC)](#infraestrutura-iac)
- [Observabilidade](#observabilidade)
- [Segurança](#segurança)
- [Decisões de Arquitetura (ADRs)](#decisões-de-arquitetura-adrs)

---

## Visão Geral

O LP Engine resolve um problema real de agências de marketing: a criação de landing pages é lenta, cara e dependente de pessoas. O sistema recebe um briefing via API, enfileira um job de geração e retorna uma LP completa — com copy otimizado e design responsivo — sem intervenção humana.

**Fluxo principal:**

```
Briefing (API) → Fila (BullMQ/Redis) → Worker → RAG (pgvector) → LLM (Groq) → HTML Assembly → Preview
```

**Diferenciais técnicos:**
- Processamento **100% assíncrono** via Event-Driven Architecture — a API nunca bloqueia aguardando a IA
- **RAG com pgvector** dentro do próprio PostgreSQL — sem serviço vetorial externo
- **MCP Server** padroniza a comunicação entre o Worker e as ferramentas de dados
- Infraestrutura provisionada com **Terraform** (AWS EC2 + RDS em VPC isolada)
- **Observabilidade completa** com Prometheus + Grafana (métricas de geração, fila e erros)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cliente / Browser                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌────────────────────────────────────────────────────────────────┐
│               Dashboard — Next.js 15 (porta 3002)              │
│         Polling de status · Preview da LP gerada               │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTP
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                  API — Fastify (porta 3000)                     │
│        Validação Zod · Enfileiramento · Proxy de preview        │
└──────────┬─────────────────────────────────────────────────────┘
           │ BullMQ Job
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Redis (Queue)                            │
│         Persistência · Retry · Backoff Exponencial           │
└──────────┬───────────────────────────────────────────────────┘
           │ Consome Job
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Worker — BullMQ                            │
│                                                              │
│  1. Chama MCP Server ──────────────────────────────────┐    │
│  2. RAG: Gemini Embedding → pgvector (cosine < 0.5) ◄──┘    │
│  3. Prompt XML-tagged → Groq (Llama 4 Scout 17B)            │
│  4. JSON → HTML/CSS Assembly ("Ultra Edition")              │
│  5. Atualiza status → PREVIEW_READY                         │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│           PostgreSQL + pgvector (RDS / Local)                │
│     Jobs · Leads · Embeddings de referência histórica        │
└──────────────────────────────────────────────────────────────┘
```

---

## Stack

| Camada | Tecnologia | Motivo da escolha |
|---|---|---|
| **Linguagem** | TypeScript 5 + Node.js 20+ | Tipagem end-to-end no monorepo |
| **API** | Fastify | Menor overhead vs. Express; plugins nativos de schema |
| **Fila** | BullMQ + Redis | Retry nativo, backoff exponencial, dashboards de fila |
| **ORM** | Prisma | Migrations versionadas; client tipado |
| **Banco** | PostgreSQL + pgvector | Busca vetorial dentro do banco relacional; sem serviço extra |
| **LLM** | Groq (Llama 4 Scout 17B) | Time-to-First-Token < 1s; JSON mode nativo |
| **Embeddings** | Google Gemini Embedding 2 | Qualidade semântica; custo baixo por token |
| **MCP** | Model Context Protocol (custom) | Desacopla o Worker das ferramentas de dados |
| **Frontend** | Next.js 15 (App Router) | Server Actions; otimização de imagem nativa |
| **IaC** | Terraform | Estado remoto no S3; provisiona EC2 + RDS + VPC |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy SSH |
| **Observabilidade** | Prometheus + Grafana | Métricas de fila, latência de geração e erros |
| **Testes** | Vitest · Playwright · Artillery | Unit, E2E e stress respectivamente |

---

## Estrutura do Monorepo

```
lp-engine/
├── apps/
│   ├── api/              # Fastify — validação, enfileiramento, proxy (porta 3000)
│   ├── worker/           # BullMQ — pipeline de IA e assembly de HTML
│   ├── dashboard/        # Next.js 15 — interface de acompanhamento (porta 3002)
│   └── mcp/              # MCP Server — ferramentas de dados para o Worker
│
├── packages/
│   ├── ai/               # SDKs Groq + Gemini, lógica de prompts e RAG
│   ├── database/         # Prisma client, migrations e seeds
│   ├── queue/            # Configurações BullMQ compartilhadas
│   ├── logger/           # Pino logger padronizado
│   └── schemas/          # Validações Zod compartilhadas entre apps
│
├── terraform/            # IaC: VPC, EC2, RDS, Security Groups
├── infra/                # Docker Compose, Prometheus config, Grafana dashboards
├── tests/                # Artillery stress tests e payloads de mock
├── .github/
│   └── workflows/
│       └── deploy.yml    # Pipeline CI/CD completo
└── README.md
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 20+ e [pnpm](https://pnpm.io)
- Docker & Docker Compose
- Chaves de API:
  - `GROQ_API_KEY` — obtenha em [console.groq.com](https://console.groq.com)
  - `GEMINI_API_KEY` — obtenha em [aistudio.google.com](https://aistudio.google.com)

### 1. Clone e configure variáveis

```bash
git clone https://github.com/seu-usuario/lp-engine.git
cd lp-engine
cp .env.example .env
# Preencha GROQ_API_KEY e GEMINI_API_KEY no .env
```

### 2. Instale dependências e suba a infra local

```bash
pnpm install

# Sobe PostgreSQL + Redis via Docker
docker-compose -f infra/docker-compose.yml up -d
```

### 3. Configure o banco de dados

```bash
# Aplica o schema e roda as migrations
pnpm db:push

# Popula o banco com referências RAG de exemplo
pnpm db:seed
```

### 4. Inicie os serviços

```bash
# Em terminais separados:

# API (porta 3000)
pnpm --filter @lp-engine/api dev

# Worker (consome jobs da fila)
pnpm --filter @lp-engine/worker dev

# Dashboard (porta 3002)
pnpm --filter dashboard dev
```

Acesse `http://localhost:3002` para abrir o Dashboard.

### Variáveis de ambiente

| Variável | Descrição | Obrigatório |
|---|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL | ✅ |
| `REDIS_URL` | Connection string do Redis | ✅ |
| `GROQ_API_KEY` | Chave da API Groq (LLM) | ✅ |
| `GEMINI_API_KEY` | Chave da API Gemini (Embeddings) | ✅ |
| `NODE_ENV` | `development` ou `production` | ✅ |

> **Nunca commite o `.env`.** Veja a seção [Segurança](#segurança).

---

## Testes

```bash
# Testes unitários (Vitest)
pnpm test

# Testes E2E com Playwright (requer o sistema rodando)
pnpm --filter dashboard exec playwright test

# Teste de stress — simula carga na API de geração
npx artillery run tests/stress-test.yml
```

### Cobertura de testes

| Tipo | Ferramenta | O que cobre |
|---|---|---|
| **Unitário** | Vitest | Worker (pipeline de IA), validações Zod, assembly HTML |
| **E2E** | Playwright | Fluxo completo: briefing → status → preview no Dashboard |
| **Stress** | Artillery | Capacidade da API e comportamento da fila sob carga |

---

## CI/CD

O pipeline roda automaticamente em todo push para `main`:

```
Push → main
   │
   ├─ Lint (ESLint + TypeScript check)
   ├─ Testes Unitários (Vitest)
   ├─ Testes E2E (Playwright)
   ├─ Build (pnpm build)
   └─ Deploy via SSH
          └─ docker compose pull && docker compose up -d
```

**Secrets necessários no GitHub:**

| Secret | Descrição |
|---|---|
| `SSH_HOST` | IP da instância EC2 |
| `SSH_USER` | Usuário SSH (ex: `ubuntu`) |
| `SSH_PRIVATE_KEY` | Chave privada RSA para acesso à EC2 |
| `GROQ_API_KEY` | Injetada no ambiente de produção |
| `GEMINI_API_KEY` | Injetada no ambiente de produção |

Veja o workflow completo em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Infraestrutura (IaC)

Toda a infraestrutura AWS é provisionada via **Terraform** com estado remoto armazenado em S3.

```bash
cd terraform/

# Inicializa providers e backend S3
terraform init

# Visualiza o plano de mudanças
terraform plan

# Aplica (solicita confirmação)
terraform apply
```

### Recursos provisionados

| Recurso | Tipo | Configuração |
|---|---|---|
| **VPC** | `aws_vpc` | CIDR `/16`, subnets pública e privada |
| **EC2** | `t3.small` | Docker + Docker Compose pré-instalados |
| **RDS** | `db.t3.micro` | PostgreSQL 15, subnet privada, Multi-AZ opcional |
| **Security Group (EC2)** | Ingress | Portas 80, 443, 3000, 3002 abertas; SSH restrito ao IP do deploy |
| **Security Group (RDS)** | Ingress | Acesso restrito apenas ao SG da EC2 |

> O RDS nunca é exposto à internet pública. A conexão só é possível a partir da EC2 dentro da mesma VPC.

---

## Observabilidade

O sistema expõe métricas via **Prometheus** e as visualiza no **Grafana**.

```bash
# Sobe Prometheus + Grafana junto com a infra local
docker-compose -f infra/docker-compose.yml up -d

# Grafana disponível em:
http://localhost:3001  # admin / admin
```

### Métricas monitoradas

| Métrica | Descrição |
|---|---|
| `lp_generation_duration_seconds` | Latência end-to-end de geração por LP |
| `lp_queue_size` | Tamanho atual da fila BullMQ |
| `lp_generation_errors_total` | Total de erros por tipo (LLM, DB, Assembly) |
| `lp_rag_context_score` | Score médio de similaridade coseno das referências recuperadas |
| `http_request_duration_seconds` | Latência das rotas da API Fastify |

---

## Segurança

- **Secrets**: Todas as chaves de API são gerenciadas via **GitHub Secrets** em produção e `.env` local (nunca commitado).
- **Isolamento de rede**: O RDS está em subnet privada — inacessível via internet pública.
- **Validação de inputs**: Todos os payloads são validados com **Zod** antes de qualquer processamento.
- **Rate limiting**: A API possui rate limiting configurado no Fastify para prevenir abuso e spam de formulários.
- **Retry com backoff exponencial**: O Worker reprocessa jobs com falha de forma progressiva, respeitando rate limits de APIs externas (Groq, Gemini).
- **`.gitignore`**: `.env`, chaves SSH e artefatos de build estão explicitamente ignorados.

---

## Decisões de Arquitetura (ADRs)

### ADR-01 — Por que BullMQ em vez de processar na API?

A geração de LP via LLM leva de 8 a 15 segundos. Processar sincronamente na API bloquearia conexões HTTP e degradaria a experiência sob carga. O BullMQ com Redis isola o processamento pesado, libera a API imediatamente (HTTP 202) e permite retries sem reprocessar o briefing do zero.

### ADR-02 — Por que pgvector em vez de Pinecone ou Weaviate?

Manter a busca vetorial dentro do PostgreSQL elimina um serviço externo, reduz latência de rede e simplifica o deploy. O custo operacional fica contido na instância RDS existente. Para o volume atual (milhares de embeddings, não bilhões), pgvector tem performance suficiente com índice IVFFlat.

### ADR-03 — Por que Groq (Llama 4 Scout) em vez de Claude ou GPT-4?

O gargalo do sistema é a latência de geração. O Groq tem Time-to-First-Token < 1s graças ao hardware LPU customizado, o que é decisivo para a experiência de preview em tempo real. O Llama 4 Scout 17B tem suporte nativo a JSON Object mode, eliminando parsing frágil de markdown.

### ADR-04 — Por que Monorepo com pnpm Workspaces?

Os apps compartilham tipos (schemas Zod, Prisma client, configurações de fila). Um monorepo garante que uma mudança no schema do banco seja refletida simultaneamente na API, no Worker e no Dashboard sem sincronização manual de pacotes npm.

### ADR-05 — Por que EC2 + RDS em vez de serviços serverless?

O Worker precisa manter conexão persistente com o Redis (BullMQ). Funções serverless (Lambda) têm cold start e limitação de tempo de execução que conflitam com jobs de 10-15s. EC2 + Docker oferece previsibilidade de custo e controle total do ambiente de runtime.

---

## Licença

MIT © 2026 LP Engine

---

<p align="center">
  Construído com TypeScript · Groq · pgvector · BullMQ · Terraform
</p>
