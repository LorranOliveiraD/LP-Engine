# 📅 Cronograma de Implementação — Portfólio DevOps/SRE & IA (2 Meses)

> **Meta do Projeto:** Construir, provisionar e monitorar a arquitetura completa do LP Engine em **8 semanas (40 dias úteis)**, com foco absoluto em IaC, CI/CD, Testes e Integração com Gemini Flash via MCP na AWS Free Tier.

---

## 🏗️ Semana 1: Fundação, Terraform & Infra AWS (Dias 1 a 5)
*Objetivo: Estabelecer a infraestrutura de rede e servidores como código, antes de qualquer lógica.*

- [x] **Dia 1 (Segunda):** Setup do repositório, Monorepo com Turborepo. Configuração inicial do estado remoto do Terraform (S3 Backend).
- [x] **Dia 2 (Terça):** **IaC (Terraform):** Escrever o `main.tf` definindo a VPC, Subnets Públicas/Privadas e Security Groups na AWS.
- [x] **Dia 3 (Quarta):** **IaC (Terraform):** Provisionar o RDS (PostgreSQL Free Tier) e uma instância EC2 (t2.micro) no Terraform.
- [x] **Dia 4 (Quinta):** Setup de Containers. Criar `docker-compose.yml` para desenvolvimento local contendo Postgres, Redis, Prometheus e Grafana.
- [x] **Dia 5 (Sexta):** **CI/CD Inicial:** Criar pipeline no GitHub Actions para rodar `terraform plan` em Pull Requests e validação básica do código.

---

## 🧪 Semana 2: Core da API & Cultura de Testes (Dias 6 a 10)
*Objetivo: Desenvolver o backend (Fastify) com forte presença de TDD e validação de contratos.*

- [x] **Dia 6 (Segunda):** Modelagem do Prisma (`schema.prisma`) e tipagens Zod. Criar migrações iniciais.
- [x] **Dia 7 (Terça):** Setup do Fastify e testes unitários (Vitest). Garantir cobertura inicial antes das rotas complexas.
- [ ] **Dia 8 (Quarta):** Desenvolvimento da rota de Intake (Briefings) em TDD (Test-Driven Development).
- [ ] **Dia 9 (Quinta):** Rotas CRUD de Clientes. Criação de endpoints documentados (Swagger/OpenAPI).
- [ ] **Dia 10 (Sexta):** Refinar o Pipeline CI/CD. Adicionar o job de `pnpm test` e `pnpm lint` como bloqueio para merges na branch principal.

---

## 🚦 Semana 3: Mensageria e Observabilidade (Dias 11 a 15)
*Objetivo: Lidar com o processamento assíncrono e ter visibilidade do que acontece por baixo dos panos.*

- [ ] **Dia 11 (Segunda):** Setup do BullMQ e Redis. Separar a API do processo Worker (`worker.ts`).
- [ ] **Dia 12 (Terça):** Produtor/Consumidor de Briefings. Garantir que o job vai para a fila corretamente.
- [ ] **Dia 13 (Quarta):** **Observabilidade (Prometheus):** Adicionar exportador de métricas à API e ao Worker (medir tamanho da fila, latência de requests).
- [ ] **Dia 14 (Quinta):** **Logs Estruturados:** Configurar o Winston para gerar logs em formato JSON, rastreando o `jobId` em todas as etapas.
- [ ] **Dia 15 (Sexta):** **Dashboards (Grafana):** Criar um dashboard local no Grafana que leia as métricas do Prometheus e exiba a saúde das filas e da API.

---

## 🧠 Semana 4: IA & MCP com Gemini Flash (Dias 16 a 20)
*Objetivo: Integrar o modelo do Google de forma profissional e escalável usando RAG.*

- [ ] **Dia 16 (Segunda):** Habilitar `pgvector` e criar scripts para popular o banco com embeddings (LPs de teste).
- [ ] **Dia 17 (Terça):** Integração via API do **Gemini Flash Free**. Testes unitários de prompt.
- [ ] **Dia 18 (Quarta):** **Servidor MCP:** Implementar o Model Context Protocol, criando as ferramentas (*tools*) de leitura do Postgres para o Gemini.
- [ ] **Dia 19 (Quinta):** Orquestrar o fluxo no Worker: Fila -> Busca RAG -> Aciona MCP/Gemini -> Retorna JSON Estruturado.
- [ ] **Dia 20 (Sexta):** Implementar lógicas de Retry e Backoff Exponencial no Worker caso a API do Gemini atinja limites de rate. Adicionar métricas de "Tempo de Geração" ao Prometheus.

---

## 🖥️ Semana 5 e 6: Frontend, Edge & Testes E2E (Dias 21 a 30)
*Objetivo: Criar a interface de controle e provar seu funcionamento de ponta a ponta.*

- [ ] **Dia 21-23:** Setup do Next.js (Dashboard), telas de acompanhamento de status da LP consumindo a API.
- [ ] **Dia 24-25:** Integração com Cloudflare (Pages/Workers) para deploy dinâmico do HTML gerado pela IA (Edge Computing).
- [ ] **Dia 26-28:** **Testes E2E (Playwright):** Criar robôs que simulam a criação de um cliente e um briefing completo pelo painel.
- [ ] **Dia 29-30:** Adicionar Testes E2E ao pipeline do GitHub Actions para rodarem em paralelo aos testes unitários.

---

## 🚀 Semana 7 e 8: Deploy HML/PROD e Refinamentos (Dias 31 a 40)
*Objetivo: Provar a arquitetura na AWS e garantir que o pipeline faz o deploy automático do código limpo.*

- [ ] **Dia 31-33:** Pipeline de CD (Continuous Deployment). Fazer o GitHub Actions atualizar o código na instância EC2 via SSH/Docker ao sofrer merge na `main`.
- [ ] **Dia 34-35:** Configurar a comunicação segura (Security Groups) entre a EC2 e o RDS provisionados pelo Terraform.
- [ ] **Dia 36-37:** Deploy da stack de Observabilidade na nuvem (Prometheus e Grafana acessíveis via IP/Domínio).
- [ ] **Dia 38:** Teste de Stress Simulado (Artillery/K6) monitorando os gargalos no Grafana.
- [ ] **Dia 39:** Documentação final do Repositório (README de alto nível, instruções para rodar o Terraform).
- [ ] **Dia 40 - GOLIVE:** Apresentação da arquitetura. Gravação de demonstração em vídeo do pipeline funcionando e da inteligência operando sem custos de nuvem recorrentes.
