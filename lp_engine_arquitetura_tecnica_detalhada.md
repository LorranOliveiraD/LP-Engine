# 🏛️ Especificação Técnica de Arquitetura: LP Engine

Este documento detalha a engenharia por trás do **LP Engine**, uma plataforma industrial para geração de Landing Pages de alta conversão utilizando Inteligência Artificial Generativa e RAG (Retrieval-Augmented Generation).

---

## 1. Visão Geral do Sistema

O LP Engine foi projetado sob o paradigma de **Arquitetura Orientada a Eventos (EDA)** e **Separação de Preocupações (SoC)**. O objetivo principal é garantir que a geração pesada de IA não bloqueie a interface do usuário, mantendo uma experiência fluida através de processamento assíncrono.

### 📐 Diagrama de Fluxo de Dados
1. **Ingestão**: API (Fastify) recebe o briefing e valida o schema (Zod).
2. **Enfileiramento**: O Job é persistido no Redis via BullMQ.
3. **Orquestração**: O Worker consome o Job e inicia o pipeline de IA.
4. **Contextualização (RAG)**: O Worker consulta o Servidor MCP para buscar referências históricas no Postgres (pgvector).
5. **Geração (LLM)**: O prompt otimizado (XML Tagging) é enviado ao Groq (Llama 4 Scout).
6. **Montagem (Assembly)**: O JSON retornado é transformado em HTML/CSS "Ultra Edition".
7. **Entrega**: O status é atualizado para `PREVIEW_READY` e o Dashboard (Next.js) libera a visualização via polling/proxy.

---

## 2. Estrutura de Diretórios (Monorepo)

O projeto utiliza uma estrutura de **Monorepo** para manter a coesão entre os serviços e o compartilhamento de tipos:

```text
lp-engine/
├── apps/
│   ├── api/                # Backend Fastify (Porta 3000)
│   ├── worker/             # Processador BullMQ (Lógica de IA/Assembly)
│   ├── dashboard/          # Interface Next.js (Porta 3002)
│   └── mcp/                # Servidor Model Context Protocol
├── packages/
│   ├── ai/                 # SDKs Groq/Gemini e lógica de Prompts
│   ├── database/           # Prisma Client, Migrations e Seeds
│   ├── queue/              # Configurações compartilhadas do BullMQ
│   ├── logger/             # Utilitário de logging padronizado (Pino)
│   └── schemas/            # Validações Zod compartilhadas
├── terraform/              # Infraestrutura como Código (AWS/RDS/EC2)
├── infra/                  # Configurações Docker, Prometheus e Grafana
├── tests/                  # Testes de Stress (Artillery) e Mock payloads
└── README.md               # Guia de setup rápido
```

---

## 3. Stack Tecnológica (The "Gold" Stack)

### 2.1 Backend & Orquestração
- **Node.js 20+ & TypeScript**: Base sólida e tipada.
- **Fastify**: Framework web de alta performance (baixo overhead).
- **BullMQ + Redis**: Gestão de filas com suporte a retries, backoff exponencial e monitoramento de concorrência.
- **Prisma ORM**: Camada de acesso a dados tipada e resiliente.

### 2.2 Inteligência Artificial & RAG
- **Groq (Llama 4 Scout 17B)**: Escolhido pela latência recorde (<1s de Time-to-First-Token) e suporte nativo a JSON Object mode.
- **Google Gemini Embedding 2**: Utilizado para vetorizar briefings e buscar similaridade semântica.
- **pgvector**: Extensão do PostgreSQL que permite buscas vetoriais de vizinho mais próximo (Cosine Distance) dentro do banco relacional.
- **Model Context Protocol (MCP)**: Padronização da comunicação entre a IA e as ferramentas de dados locais.

### 2.3 Frontend
- **Next.js 15 (App Router)**: Interface moderna com Server Actions e otimização de imagem.
- **Vanilla CSS (Premium)**: Implementação de design system dinâmico (Glassmorphism, CSS Variables) sem dependência de bibliotecas pesadas.

---

## 4. Estratégias de Otimização e Performance

### 3.1 Otimização de Prompt (Prompt Engineering)
- **XML Tagging**: Isolamento semântico do contexto do MCP para evitar "Lost in the Middle".
- **Strict Top-K**: Redução do contexto RAG para os 3 itens mais relevantes (threshold de distância < 0.5) para manter o payload leve.

### 3.2 Page Assembly "Ultra"
- **Design Tokens Dinâmicos**: A IA define a paleta de cores e a tipografia em tempo real, permitindo que cada LP seja única e adaptada ao nicho do cliente.
- **Micro-interações**: CSS avançado para garantir que a página gerada não pareça um "template", mas uma criação customizada.

---

## 5. Infraestrutura e DevOps (Infrastructure as Code)

### 4.1 Cloud (AWS)
- **EC2 (T3.Micro/Small)**: Instância otimizada para rodar os containers Docker.
- **RDS PostgreSQL**: Instância gerenciada com isolamento de rede (Private Subnet).
- **Security Groups**: Regras de firewall granulares (EC2 ingress para 80/443/3000/3002; RDS ingress restrito ao SG da EC2).

### 4.2 CI/CD Pipeline
- **GitHub Actions**: Automação total desde o Lint até o Deploy via SSH (Docker Compose down/up).
- **Testes Multi-camada**: 
  - Unitários (Vitest).
  - End-to-End (Playwright).
  - Stress (Artillery).

---

## 6. Observabilidade (Dia 36-37)

- **Prometheus**: Coleta de métricas de tempo de geração, tamanho da fila e erros de API.
- **Grafana**: Dashboards visuais para monitoramento em tempo real do estado da "Fábrica".

---

## 7. Segurança e Resiliência

- **Criptografia**: Variáveis sensíveis (API Keys) geridas via GitHub Secrets e `.env` protegidos.
- **Isolamento**: Banco de dados inacessível via internet pública.
- **Retry Policy**: O Worker implementa re-tentativas automáticas com tempo de espera crescente para lidar com Rate Limits de APIs externas.

---
Este sistema representa o estado da arte na fusão entre **Engenharia de Software Tradicional** e **IA Generativa**, focado em entregar valor real com custo operacional mínimo.

**© 2026 LP Engine Engineering.**
