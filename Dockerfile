# Stage 1: Build React Admin SPA
FROM node:20-alpine AS spa-builder

WORKDIR /app/admin_spa
COPY admin_spa/package*.json ./
RUN npm ci
COPY admin_spa/ ./
RUN npm run build

# Stage 2: Build Backend Express TypeScript
FROM node:20-alpine AS backend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 3: Production Runtime Image for Dokploy (10.88.199.214)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030
ENV STORAGE_PATH=/mnt/ani
ENV SAMBA_MOUNT_PATH=/mnt/samba
ENV WEB_SERVER_IP=10.88.199.214
ENV LINUX_SERVER_IP=10.88.199.195
ENV NTP_SERVER=10.88.199.195
ENV NFS_SERVER=10.88.199.195:/ani
ENV SAMBA_SERVER=//10.88.199.195/compartido
ENV NIS_DOMAIN=labnis

# Crear puntos de montura dentro del contenedor para recibir los bind mounts del host (10.88.199.214)
RUN mkdir -p /mnt/ani /mnt/samba /app/storage/nfs_docs /app/storage/samba_docs

COPY package*.json ./
RUN npm ci --only=production

COPY --from=backend-builder /app/dist ./dist
COPY --from=spa-builder /app/admin_spa/dist ./admin_spa/dist
COPY public ./public

EXPOSE 3030

# Healthcheck para Docker Swarm y Dokploy (start-period extendido para permitir sincronización NTP)
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3030/health || exit 1

CMD ["node", "dist/server.js"]
