# Dockerfile at git repo root (parent of lucky-spins-source/ app dir)
# Build context is the repo root, app lives in lucky-spins-source/ subdirectory
FROM node:20-alpine

WORKDIR /app

# The app is in the nested lucky-spins-source/ subdirectory
COPY lucky-spins-source/package.json lucky-spins-source/pnpm-lock.yaml ./
COPY lucky-spins-source/patches ./patches/
COPY lucky-spins-source/server ./server/
COPY lucky-spins-source/client ./client/
COPY lucky-spins-source/shared ./shared/
COPY lucky-spins-source/drizzle ./drizzle/
COPY lucky-spins-source/drizzle.config.ts ./
COPY lucky-spins-source/tsconfig.json ./
COPY lucky-spins-source/tsconfig.node.json ./
COPY lucky-spins-source/vite.config.ts ./
COPY lucky-spins-source/components.json ./

RUN corepack enable && corepack prepare pnpm@9 && pnpm install --frozen-lockfile

RUN pnpm build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "-c", "pnpm run start"]