# Build context is ../ (app/), not this directory — gameEngine shares the Prisma schema with
# the main Next.js app (same DB, same Card table) instead of keeping a second copy that could
# drift out of sync. See docker-compose.yml: game_engine.build.context.

# --- STAGE 1: Install dependencies + generate the Prisma client ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY gameEngine/package.json gameEngine/package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --libc=musl
RUN npx prisma generate --schema=prisma/schema.prisma

# --- STAGE 2: Development stage (ts-node, matches the socket.io game server) ---
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY gameEngine .

EXPOSE 4000
CMD ["npm", "run", "dev"]

# --- STAGE 3: Build stage (compiles TS to dist/, no ts-node at runtime) ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY gameEngine .

RUN npm run build

# --- STAGE 4: Production stage (plain node, matches app/Dockerfile's pattern) ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gameengine

COPY --from=builder --chown=gameengine:nodejs /app/dist ./dist
COPY --from=builder --chown=gameengine:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gameengine:nodejs /app/package.json ./package.json

USER gameengine

EXPOSE 4000
CMD ["npm", "run", "start"]
