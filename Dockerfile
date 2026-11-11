# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE_PATH=/app/storage/nfs_docs

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY public ./public
COPY storage ./storage

EXPOSE 3000

# Healthcheck para Docker Swarm y Dokploy
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
