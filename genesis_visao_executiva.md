# 🚀 LP Engine — Arquitetura de Portfólio (DevOps / SRE / IA)

> **Para Tech Leads e Recrutadores Técnicos:** Uma demonstração prática de engenharia de software avançada. Este projeto eleva o nível do tradicional "CRUD de portfólio" ao apresentar uma arquitetura real combinando Infraestrutura como Código (Terraform), Edge Computing, integração de IA (Gemini via MCP) e práticas sólidas de DevOps (CI/CD, Observabilidade e Testes).

---

## 1. O Propósito da Arquitetura

O **LP Engine** simula um motor autônomo de geração de Landing Pages de alta performance. Mais do que a funcionalidade do produto em si, o objetivo principal é **demonstrar domínio sobre o ciclo de vida completo de uma aplicação escalável**, desde o provisionamento da infraestrutura na AWS até o monitoramento da aplicação em produção.

Diferenciais técnicos do projeto:
- **IaC (Terraform):** Toda a infraestrutura da AWS é provisionada via código, garantindo reprodutibilidade e controle de versão.
- **Edge Computing:** Uso do Cloudflare Workers e Pages para deploys instantâneos e distribuição global estática, reduzindo carga nos servidores.
- **Integração LLM Genuína:** Substituição de chamadas de API simples por um servidor **MCP (Model Context Protocol)** integrado ao **Gemini Flash Free**, permitindo que a IA consuma o banco de dados via **RAG** e gere as páginas de forma determinística.

---

## 2. Padrões de Qualidade (O que as empresas buscam)

### CI/CD Visível e Automatizado
O projeto não existe apenas no "localhost". Há um pipeline de **GitHub Actions** rigoroso que:
1. Executa linters e verificação de tipagem (TypeScript).
2. Roda a suíte de testes automatizados (Unitários e Integração).
3. Constrói as imagens Docker.
4. Aplica os planos do Terraform (Terraform Plan/Apply) em ambientes separados.
5. Faz o deploy contínuo das novas versões.

### Observabilidade e SRE
Um diferencial crítico para níveis Pleno/Sênior. O sistema não opera às cegas:
- **Logs Estruturados:** Formato JSON (ex: Winston) para fácil ingestão.
- **Métricas:** Exportação de métricas de uso de CPU, memória, tamanho de filas (BullMQ) e tempo de resposta da IA usando **Prometheus**.
- **Dashboards:** **Grafana** configurado para visualizar os gargalos do sistema e os custos operacionais (monitoramento de tokens do Gemini e limites da AWS Free Tier).

### Cultura de Testes
O recrutador assume que o código quebra se não houver testes. O LP Engine inclui:
- **Testes Unitários (Vitest):** Validando as lógicas de negócio e as ferramentas do MCP.
- **Testes E2E (Playwright):** Simulando a jornada do usuário no Dashboard e a correta geração da LP.

---

## 3. Otimização de Custos (Modalidade Gratuita/Básica)

A arquitetura foi inteiramente desenhada para rodar em **Free Tiers**, provando a capacidade de arquitetar soluções de altíssimo custo-benefício (CostOps):

- **Cloud (AWS Free Tier):** Provisionamento de instâncias EC2 t2.micro e RDS PostgreSQL via Terraform, consumindo a cota gratuita.
- **IA (Gemini Flash Free):** Alta velocidade e grande janela de contexto com custo zero (tier gratuito do Google Cloud/AI Studio), perfeito para experimentação.
- **Frontend e Edge:** Hospedagem estática no Cloudflare Pages (100% gratuito) e Vercel (Hobby).
- **Resultado:** Uma infraestrutura complexa e resiliente operando sem custos recorrentes para fins de demonstração.

---

## 4. O Fluxo de Dados e Inteligência

O funcionamento interno reflete as demandas de sistemas corporativos baseados em eventos:
1. O usuário submete um briefing via Dashboard.
2. A API (Fastify) enfileira o job via **BullMQ (Redis)**.
3. Um Worker assíncrono pega o job e aciona o **RAG**, buscando no PostgreSQL (pgvector) as referências de melhor conversão.
4. O servidor **MCP** fornece essas referências ao **Gemini Flash**.
5. O Gemini estrutura o conteúdo da Landing Page.
6. O Worker monta os arquivos estáticos e orquestra o deploy via API da Cloudflare.

---

## 5. Por que este portfólio se destaca?

Enquanto a maioria dos candidatos apresenta aplicações web isoladas e focadas apenas no framework frontend ou no ORM, este projeto prova que o desenvolvedor compreende que **escrever o código é apenas 20% do trabalho**. 

Os outros 80% — infraestrutura confiável (Terraform), garantia de qualidade contínua (CI/CD, Testes), visibilidade operacional (Prometheus/Grafana) e integração com a nuvem (AWS/Cloudflare) — estão presentes, documentados e funcionais.
