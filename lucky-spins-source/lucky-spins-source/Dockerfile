FROM node:20-alpine

WORKDIR /app

# Copy patch files first (needed during install)
COPY patches/ ./patches/

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9 && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build client
RUN pnpm build

# Production start
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "-c", "pnpm run start"]