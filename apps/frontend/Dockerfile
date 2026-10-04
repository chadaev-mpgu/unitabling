# syntax=docker/dockerfile:1

# Build stage: install the pnpm workspace from the repo root and build the SPA.
# Context must be the monorepo root (see docker-compose.yml) because the
# lockfile and pnpm-workspace.yaml live there, not in apps/frontend.
FROM node:24-alpine AS build

RUN npm install -g pnpm@11.25.0

WORKDIR /app

# Workspace manifests first so dependency installation is cached independently
# of source changes.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN pnpm install --frozen-lockfile --filter frontend

# Sources, then the production build (type-check + vite build).
COPY apps/frontend apps/frontend
RUN pnpm --filter frontend build

# Runtime stage: static files behind nginx.
FROM nginx:1.27-alpine AS runtime

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
