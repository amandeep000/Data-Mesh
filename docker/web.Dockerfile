# ─── Stage 1: Dependencies ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx nx build web --configuration=production

# ─── Stage 3: Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 4200
ENV PORT=4200
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

CMD ["node", "server.js"]
