FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@12.14.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

RUN pnpm --filter @omnidash/contracts build
RUN pnpm --filter @omnidash/api build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata
ENV TZ=Europe/Warsaw
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/db/librusGroundTruth.json ./apps/api/dist/db/librusGroundTruth.json
COPY --from=builder /app/apps/api/src/db/librusGroundTruth.json ./apps/api/src/db/librusGroundTruth.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
