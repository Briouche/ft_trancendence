# Build context is the repo root: the Prisma schema is shared with app/.

# deps: node_modules + generated Prisma client
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY game_engine/package.json game_engine/package-lock.json* ./
COPY app/prisma ./prisma/
RUN npm ci --libc=musl
RUN npx prisma generate --schema=prisma/schema.prisma

# development: ts-node
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY game_engine .

EXPOSE 4000
CMD ["npm", "run", "dev"]

# builder: tsc → dist/
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY game_engine .

RUN npm run build

# prod-deps: runtime dependencies plus the generated Prisma client
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY game_engine/package.json game_engine/package-lock.json* ./
RUN npm ci --omit=dev --libc=musl

COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gameengine

COPY --from=prod-deps --chown=gameengine:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gameengine:nodejs /app/dist ./dist
COPY --from=builder --chown=gameengine:nodejs /app/package.json ./package.json

USER gameengine

EXPOSE 4000
CMD ["node", "dist/index.js"]
