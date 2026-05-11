# 📘 LP Engine — Documentação Técnica (Portfólio SRE/DevOps)

> Motor de automação de Landing Pages com IA e arquitetura robusta de DevOps: Terraform, AWS Free Tier, CI/CD, Prometheus/Grafana, e Gemini Flash via MCP.

---

## Visão Geral do Sistema

O LP Engine é uma arquitetura de demonstração projetada para simular um produto real de geração de Landing Pages. Seu foco principal é expor competências avançadas em **Engenharia de Plataforma, DevOps, SRE e IA**. O sistema gerencia uma fila assíncrona, enriquece pedidos via RAG, gera conteúdo com **Gemini Flash** (Tier Gratuito) usando MCP, e provisiona toda a infraestrutura na **AWS** via **Terraform**.

```mermaid
graph LR
    A[Briefing / CI-CD] --> B[Fastify API Intake]
    B --> C[BullMQ Redis]
    C --> D[Worker: RAG Enrichment]
    D --> E[MCP + Gemini Flash]
    E --> F[Assembly HTML]
    F --> G[Cloudflare Edge Deploy]
    
    subgraph Observabilidade
    H[Prometheus / Grafana]
    end
    
    B -.-> H
    D -.-> H
    E -.-> H
```

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Infraestrutura as Code** | Terraform | Provisionamento declarativo e versionado de recursos na AWS |
| **Cloud Provider** | AWS (Free Tier) | Uso de EC2 (para Workers/API) e RDS Postgres dentro da cota gratuita |
| **CI/CD** | GitHub Actions | Pipelines automatizados para Lint, Testes, Build e Terraform Apply |
| **Observabilidade** | Prometheus + Grafana | Coleta de métricas do sistema e visualização de saúde |
| **Testes** | Vitest + Playwright | Testes unitários para regras de negócio e E2E para interfaces |
| **Runtime & API** | Node.js 20+ & Fastify | Performance otimizada para microserviços e workers |
| **Banco & Cache** | PostgreSQL (pgvector) + Redis | Armazenamento de dados relacionais, vetores (RAG) e filas (BullMQ) |
| **Inteligência Artificial** | Gemini Flash (Free) | Modelo LLM rápido e gratuito, ideal para portfólio |
| **Protocolo IA** | MCP (Model Context Protocol) | Padronização de acesso do Gemini às ferramentas internas |
| **Deploy Estático** | Cloudflare Pages / Workers | Edge computing gratuito e de alta performance |

---

## Estrutura do Monorepo (Orientada a DevOps)

```text
lp-engine/
├── .github/
│   └── workflows/                  # CI/CD: test.yml, deploy.yml, terraform.yml
├── terraform/                      # IaC - Infraestrutura AWS
│   ├── main.tf                     # Definições principais (VPC, EC2, RDS)
│   ├── variables.tf
│   └── outputs.tf
├── apps/
│   ├── api/                        # Fastify — Backend e Workers
│   │   ├── src/
│   │   │   ├── orchestrator/       # Pipeline assíncrono (BullMQ)
│   │   │   ├── mcp/                # Integração MCP com Gemini
│   │   │   └── observability/      # Métricas Prometheus e Logs Estruturados
│   │   ├── tests/                  # Testes Unitários (Vitest)
│   │   └── Dockerfile              # Imagem otimizada da API
│   └── dashboard/                  # Next.js 15 — Interface (Vercel ou EC2)
│       └── e2e/                    # Testes E2E (Playwright)
├── packages/
│   ├── database/                   # Prisma ORM + Migrations
│   └── schemas/                    # Contratos Zod compartilhados
└── infra/
    ├── docker-compose.yml          # Ambiente local (Postgres, Redis, Grafana, Prometheus)
    └── prometheus.yml              # Configuração base de coleta de métricas
```

---

## Pipeline de Geração (Fluxo de Engenharia)

1. **Intake & Validação:** O request bate no Fastify, validado via Zod. Métricas de request rate são exportadas. O job é inserido no Redis.
2. **RAG Enrichment:** O Worker consome o job, converte o contexto do cliente em embeddings e busca no Postgres (`pgvector`) os templates de maior sucesso.
3. **Generative IA (MCP + Gemini Flash):** O Worker levanta um servidor MCP local expondo ferramentas do banco. O **Gemini Flash** consome as ferramentas, avalia o contexto do RAG e cospe a estrutura da LP em JSON.
4. **Assembly & Edge Deploy:** O sistema injeta o JSON em templates HTML estáticos e faz o push direto para a API do Cloudflare Pages.

---

## 🛡️ DevOps & SRE Práticas Implementadas

### 1. Infraestrutura como Código (Terraform)
Nenhum clique no console da AWS é aceito. Toda a infra (VPC, Security Groups, Instância EC2 t2.micro, RDS db.t3.micro) é definida na pasta `/terraform`.
- **Comando:** `terraform apply -auto-approve` automatizado via Actions.
- **State Management:** O estado do Terraform é salvo em um bucket S3 (free tier) para trabalho colaborativo e CI/CD.

### 2. CI/CD Pipeline (GitHub Actions)
Três pilares de automação garantem a estabilidade:
- **PR Checks:** Quando um Pull Request é aberto, o GitHub Actions roda `pnpm lint`, `pnpm test` (Vitest) e `terraform plan`.
- **Merge to Main:** Ao aprovar o PR, o Actions faz o `terraform apply` e atualiza a imagem Docker na AWS EC2 (ou ECR).
- **Database Migrations:** O Prisma aplica as migrations (`prisma migrate deploy`) automaticamente durante o pipeline de deploy.

### 3. Observabilidade, Métricas e Logs
O que difere um júnior de um sênior é não precisar "adivinhar" por que o sistema caiu:
- **Prometheus:** Coleta de métricas expostas pela API na rota `/metrics`. Mede latência, total de requisições, tamanho da fila do BullMQ e tempo médio de geração da IA.
- **Grafana:** Dashboard provisionado no `docker-compose` e na AWS, conectando-se ao Prometheus para exibição visual do *Health* do sistema.
- **Logs Estruturados:** Uso de bibliotecas de log que geram JSON. Facilita integrações futuras com Elasticsearch/Datadog.

### 4. Bateria de Testes
O projeto documenta rigor e qualidade:
- **Unitários:** As lógicas complexas de cálculo de RAG e formatação de MCP são testadas com *Mocks* do banco de dados e da IA.
- **E2E:** Playwright abre um navegador headless, simula o login, criação de um briefing e checa se o dashboard reflete o status correto.

---

## Configuração do Ambiente Local

```env
# === Database & Redis ===
DATABASE_URL="postgresql://genesis:genesis@localhost:5432/genesis"
REDIS_URL="redis://localhost:6379"

# === IA (Free Tier) ===
GEMINI_API_KEY="AIza..."

# === AWS & Terraform (Free Tier) ===
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Subindo Localmente (Incluindo Monitoramento)
```bash
# 1. Sobe Postgres, Redis, Prometheus e Grafana
pnpm docker:up

# 2. Inicializa o banco de dados e migrations
pnpm db:push

# 3. Roda a API e o Dashboard
pnpm dev
```

### Provisionando Infra na Nuvem
```bash
cd terraform
terraform init
terraform plan
terraform apply
```
