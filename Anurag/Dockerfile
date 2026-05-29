FROM node:20-alpine AS build

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY apps/server ./apps/server

RUN pnpm --filter @anurag/types build \
  && pnpm --filter @anurag/utils build \
  && cd apps/server && pnpm exec prisma generate && pnpm build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app/apps/server

ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/server/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/prisma ./prisma
COPY --from=build /app/apps/server/package.json ./package.json
COPY --from=build /app/packages /app/packages

EXPOSE 4000

CMD ["node", "dist/index.js"]
