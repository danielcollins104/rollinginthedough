FROM node:20-alpine

WORKDIR /app

# Install dependencies from the nested project root
COPY lucky-spins-source/lucky-spins-source/package.json lucky-spins-source/lucky-spins-source/pnpm-lock.yaml ./
COPY lucky-spins-source/lucky-spins-source/patches/ ./patches/
RUN corepack enable && corepack prepare pnpm@9 && pnpm install --frozen-lockfile

# Copy source from nested project root
COPY lucky-spins-source/lucky-spins-source/ .

# Build client
RUN pnpm build

# Production start
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "-c", "pnpm run start"]