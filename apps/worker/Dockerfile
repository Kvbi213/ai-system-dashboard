FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@12.14.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/worker/package.json ./apps/worker/

RUN pnpm install --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY apps/worker ./apps/worker

RUN pnpm --filter @omnidash/contracts build
RUN pnpm --filter @omnidash/worker build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata
ENV TZ=Europe/Warsaw
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules

CMD ["node", "apps/worker/dist/index.js"]
