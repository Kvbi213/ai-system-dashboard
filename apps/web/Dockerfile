# Multi-stage build for OmniDash Web SPA (Caddy 2 Alpine)
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@12.14.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

RUN pnpm --filter @omnidash/contracts build
RUN pnpm --filter @omnidash/web build

FROM caddy:2-alpine AS runner
RUN apk add --no-cache curl

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/web/dist /usr/share/caddy

EXPOSE 80
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1/healthz || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
