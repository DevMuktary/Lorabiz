# ==========================================
# 1. BASE STAGE
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ==========================================
# 2. DEPENDENCIES STAGE
# ==========================================
FROM base AS deps
COPY package.json package-lock.json* .npmrc* ./
RUN npm config set legacy-peer-deps true && npm install --legacy-peer-deps

# ==========================================
# 3. BUILDER STAGE
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy"

RUN npx prisma generate
RUN npx next build

# ==========================================
# 4. RUNNER STAGE (Production Standalone)
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
