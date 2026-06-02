# ─── Stage 1: install dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install libc compat for Alpine + sharp (Next.js image optimisation)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline


# ─── Stage 2: lint + typecheck + build ────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Inherit installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars — override at runtime via docker run -e or compose
ARG NEXT_PUBLIC_API_URL=http://localhost:3087/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Stub secrets so the build doesn't crash on missing env vars
ENV BETTER_AUTH_SECRET=build-placeholder
ENV BETTER_AUTH_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://build:placeholder@localhost:5432/placeholder
ENV GOOGLE_CLIENT_ID=placeholder
ENV GOOGLE_CLIENT_SECRET=placeholder

# 1. Lint
RUN npm run lint

# 2. Type-check
RUN npx tsc --noEmit

# 3. Production build (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ─── Stage 3: minimal production image ────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone output bundles only what's needed
COPY --from=builder /app/public            ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# next start is replaced by the standalone server.js
CMD ["node", "server.js"]
