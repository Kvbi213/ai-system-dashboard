# Multi-stage build for OmniDash Web SPA
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

FROM nginx:alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
