# syntax=docker/dockerfile:1

# ============================================
# Stage 0: Base (Node 26 + pnpm)
# ============================================
FROM node:26-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Node 26 does not ship Corepack. Install the pnpm version pinned in package.json.
WORKDIR /tmp/pnpm-install
COPY package.json ./
RUN PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]") \
 && npm install -g "pnpm@${PNPM_VERSION}" \
 && rm -rf /tmp/pnpm-install

WORKDIR /app

# ============================================
# Stage 1: Dependencies
# ============================================
FROM base AS deps

# Copy and package.json files (turbo.json needed for prepare scripts)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy Prisma schema before install (needed for prepare script)
COPY ./prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile --production=false

# ============================================
# Stage 2: Builder
# ============================================
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build the application using Turbo
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_GETME_BOT_INFO='{"id":6277121004,"is_bot":true,"first_name":"MicroCosmBot","username":"microcosmbotdotxyz_bot","can_join_groups":true,"can_read_all_group_messages":true,"supports_inline_queries":false}'

# Build with turbo
RUN pnpm build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:26-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files - standalone output should include these in node_modules
# If Prisma is used by the app, it will be in the standalone output
# We also copy the schema for potential migrations
COPY --from=builder /app/prisma ./prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "server.js"]

