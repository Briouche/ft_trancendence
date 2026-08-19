# --- STAGE 1: Install dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and prisma schema (needed for `postinstall: prisma generate`)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# --- STAGE 2: Development Stage ---
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

# Copy node_modules with pre-generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start:dev"]

# --- STAGE 3: Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- STAGE 4: Production Stage ---
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy full node_modules & prisma directory so `prisma migrate` and `tsx` work at startup
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start:prod"]
