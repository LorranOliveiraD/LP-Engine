# 🚀 LP Engine

[![CI — LP Engine](https://github.com/LorranOliveiraD/LP-Engine/actions/workflows/ci.yml/badge.svg)](https://github.com/LorranOliveiraD/LP-Engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Sistema autônomo de geração de Landing Pages** alimentado por IA (Gemini Flash), com pipeline de processamento assíncrono, observabilidade com Prometheus/Grafana e infraestrutura provisionada via Terraform na AWS Free Tier.

---

## 🏗️ Arquitetura

```
Cliente → Fastify API → Zod (Validação) → BullMQ (Fila) → Worker
                                                              ↓
                                                     Gemini Flash (IA)
                                                              ↓
                                                  PostgreSQL + pgvector
                                                              ↓
                                              Cloudflare Pages (Deploy)
```

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|---|---|
| **API** | Fastify + TypeScript |
| **Validação** | Zod |
| **ORM** | Prisma + pgvector |
| **Fila** | BullMQ + Redis |
| **IA** | Google Gemini Flash (Free Tier) |
| **Observabilidade** | Prometheus + Grafana |
| **IaC** | Terraform (AWS) |
| **CI/CD** | GitHub Actions |
| **Testes** | Vitest (TDD) |

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- Docker Desktop

### 1. Instalar dependências
```bash
pnpm install
```

### 2. Subir infraestrutura local (Banco + Redis + Prometheus + Grafana)
```bash
pnpm docker:up
```

### 3. Criar tabelas no banco de dados
```bash
pnpm db:push
```

### 4. Rodar a API em modo desenvolvimento
```bash
pnpm --filter api dev
```

### 5. Acessar a documentação interativa (Swagger)
```
http://localhost:3000/docs
```

## 🧪 Testes

```bash
pnpm test
```

## 📅 Progresso do Cronograma

- ✅ **Semana 1:** Infraestrutura AWS com Terraform (VPC, EC2, RDS, Security Groups)
- ✅ **Semana 2:** API Fastify com TDD, CRUD de Clientes e Documentação Swagger
- 🔄 **Semana 3:** Mensageria com BullMQ + Redis e Observabilidade
- ⏳ **Semana 4:** Integração com Gemini Flash via MCP e RAG
- ⏳ **Semana 5-6:** Frontend Next.js e Testes E2E
- ⏳ **Semana 7-8:** Deploy em produção na AWS e refinamentos finais

## 📄 Licença

MIT — veja [LICENSE](./LICENSE) para detalhes.
