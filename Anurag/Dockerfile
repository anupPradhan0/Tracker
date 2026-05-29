# syntax=docker/dockerfile:1

FROM node:20-alpine AS build

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY apps/server ./apps/server
COPY apps/web ./apps/web

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @anurag/types build \
  && pnpm --filter @anurag/utils build \
  && cd apps/server && pnpm exec prisma generate && pnpm build \
  && cd /app && pnpm --filter @anurag/web build

# --- API ---
FROM node:20-alpine AS api

RUN apk add --no-cache openssl
WORKDIR /app/apps/server

ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/server/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/prisma ./prisma
COPY --from=build /app/apps/server/package.json ./package.json
COPY --from=build /app/packages /app/packages

COPY docker/api-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]

# --- Web (nginx + static Vite build) ---
FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
