# =============================================================================
# Stage 1 — deps
# Install ALL dependencies (including dev) needed for building and dev mode.
# Kept as a separate stage so the layer is cached independently of source code.
# =============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci


# =============================================================================
# Stage 2 — development
# Inherits deps. Source code is bind-mounted at runtime by Docker Compose, so
# we do NOT copy it here. prisma generate runs at container start via CMD so
# it always reflects the schema on the bind-mounted volume.
# =============================================================================
FROM deps AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npm run dev"]


# =============================================================================
# Stage 3 — builder
# Copies source, generates the Prisma client, then produces the Next.js build.
# Uses a clean npm ci --omit=dev afterwards so that only production deps end up
# in the final image (node_modules is re-installed lean here, not in base).
# =============================================================================
FROM deps AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY . .

# Generate Prisma client (requires devDeps → done before pruning)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Prune devDependencies so the copied node_modules is production-only
RUN npm ci --omit=dev


# =============================================================================
# Stage 4 — production
# Minimal final image: only the built artefacts and production node_modules.
# Runs as a non-root user for security.
# Runs migrations before starting the server so deploys are always in sync.
# =============================================================================
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user to run the process
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what is needed to run the app
COPY --from=builder --chown=nextjs:nodejs /app/package*.json   ./
COPY --from=builder --chown=nextjs:nodejs /app/.next           ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules    ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma

USER nextjs

EXPOSE 3000

# Run pending migrations then start the server.
# Using migrate deploy (not migrate dev) — safe for production: never prompts,
# never resets data, only applies already-committed migration files.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
