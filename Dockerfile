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
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

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

# Dummy env variables during build to pass build-time checks if any
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy"
ENV NEXTAUTH_SECRET="build_time_dummy_secret_1234567890"
ENV NEXTAUTH_URL="http://localhost:3000"

RUN npx prisma generate
RUN npm run build || npx next build

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
