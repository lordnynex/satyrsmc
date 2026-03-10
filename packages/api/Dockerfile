# Single stage: install only API + shared deps, run source (no bundle). Small image.
# Build context: repo root. Env: NODE_ENV, DATABASE_URL, LOG_LEVEL, PORT (default 3000).

FROM oven/bun:1-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Slim workspace: api + shared only (no web/app-admin = no React, tiptap, etc.)
COPY packages/api/docker-root.package.json package.json
COPY packages/api packages/api
COPY packages/shared packages/shared

# Install for target platform; --production keeps devDependencies out.
ARG TARGETPLATFORM=linux/amd64
RUN set -- $(echo "$TARGETPLATFORM" | tr '/' ' ') && \
  BUN_OS=$1 BUN_CPU=$2 && \
  case "$BUN_CPU" in amd64) BUN_CPU=x64 ;; esac && \
  bun install --production --os="$BUN_OS" --cpu="$BUN_CPU"

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run source directly so sharp and other natives resolve from node_modules.
ENTRYPOINT ["bun", "run", "packages/api/src/api-only.ts"]
