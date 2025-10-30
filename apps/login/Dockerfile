FROM node:22-alpine AS deps
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/zitadel-proto/package.json ./packages/zitadel-proto/
COPY packages/zitadel-client/package.json ./packages/zitadel-client/
COPY apps/login/package.json ./apps/login/

RUN pnpm install --frozen-lockfile


FROM node:22-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=deps /workspace/apps/login/node_modules ./apps/login/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json ./

COPY packages/zitadel-proto ./packages/zitadel-proto
COPY packages/zitadel-client ./packages/zitadel-client

COPY apps/login ./apps/login

WORKDIR /workspace/packages/zitadel-proto
RUN pnpm build 2>/dev/null || true

WORKDIR /workspace/packages/zitadel-client
RUN pnpm build 2>/dev/null || true

WORKDIR /workspace/apps/login
ENV NEXT_OUTPUT_MODE=standalone
ENV NEXT_PUBLIC_BASE_PATH=/ui/v2/login
RUN pnpm build


FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p /.env-file && touch /.env-file/.env && chown -R nextjs:nodejs /.env-file

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/login/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/login/.next/static ./apps/login/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/login/public ./apps/login/public

USER nextjs

ENV HOSTNAME="::" \
    PORT="3000" \
    NODE_ENV="production"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/bin/sh", "-c", "node /app/healthcheck.js http://localhost:${PORT}/ui/v2/login/healthy"]

ENTRYPOINT ["/app/entrypoint.sh", "node", "apps/login/server.js"]