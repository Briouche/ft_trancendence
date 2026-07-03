# --- Base Stage ---
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# --- Dependencies Stage (All) ---
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# This automatically triggers "prisma generate" due to postinstall script
RUN npm ci

# --- Dependencies Stage (Production Only) ---
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# Only installs production dependencies, saving hundreds of megabytes
RUN npm ci --omit=dev

# --- Development Stage ---
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
ENV NODE_ENV=development

# --- Builder Stage ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production Stage ---
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone Next.js server files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy package.json so "npm run start:prod" works
COPY package.json ./

# Copy only production node_modules to keep the image lean
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000
