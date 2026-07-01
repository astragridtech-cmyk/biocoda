# Build context is the monorepo root (see docker-compose.yml).
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @biocoda/web build

FROM node:22-slim AS run
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
