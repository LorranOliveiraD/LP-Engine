# Estágio de Build
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter dashboard build

# Estágio de Produção
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/packages ./packages

# Instala apenas as dependências de produção
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "--filter", "dashboard", "start"]
