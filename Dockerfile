# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
# Isolated so a source-only change skips npm ci entirely (package-lock.json is
# the cache key). BuildKit --mount=type=cache persists the npm cache across
# builds so only new/changed packages are downloaded.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --prefer-offline

# ── Stage 2: Build the SPA ─────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
# Bring pre-installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy source last — changes here only invalidate the build step, not npm ci.
COPY . .
RUN npm run build

# ── Stage 3: Production runtime ────────────────────────────────────────────────
# nginx:1.27-alpine ships with a pre-created 'nginx' user (uid 101).
# We move nginx to port 8080 so it can run without root privileges.
FROM nginx:1.27-alpine AS runtime

# Pre-create nginx temp dirs and pid file so the 'nginx' user can write them.
# nginx tries to create these at startup; without root it will fail unless they
# already exist and are owned by the right user.
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
 && chown -R nginx:nginx /var/cache/nginx \
 && touch /var/run/nginx.pid \
 && chown nginx:nginx /var/run/nginx.pid \
 && rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="Quorum Dashboard" \
      org.opencontainers.image.description="Quorum governance dashboard — nginx SPA, proxies /api/* → gateway:3001" \
      org.opencontainers.image.source="https://github.com/ayansasmal/Quorum-dash" \
      org.opencontainers.image.revision="${VCS_REF}"

USER nginx
EXPOSE 8080
