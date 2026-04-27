# syntax=docker/dockerfile:1
#
# Multi-stage: Node builds static assets; Nginx serves `dist/`. Vite inlines VITE_* at build time.
# Build: docker compose --env-file docker/compose.env build
#   or:  docker build --build-arg VITE_AUTH_SERVICE_URL=... .

# ---- Build (Vite) ----
FROM node:22-alpine AS builder

WORKDIR /app

# libc6-compat: some prebuilt Node deps
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# All public client config (baked into JS/HTML). Pass via `build.args` in Compose or --build-arg.
ARG VITE_AUTH_SERVICE_URL=http://localhost:8000/api/v1
ARG VITE_ORDER_SERVICE_URL=http://localhost:8001/api
ARG VITE_PRODUCT_SERVICE_URL=http://localhost:5001/api/v1
ARG VITE_ECOMMERCE_READ_SERVICE_URL=http://localhost:5004
ARG VITE_ECOMMERCE_READ_GRAPHQL_URL=http://localhost:5004/graphql
ARG VITE_SHIPPING_SERVICE_URL=http://localhost:5005/api/v1
ARG VITE_STRIPE_PUBLIC_KEY=
ARG VITE_RECAPTCHA_SITE_KEY=
ARG VITE_MAP_PROVIDER=osm
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_USE_MOCK_API=false

ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_ORDER_SERVICE_URL=$VITE_ORDER_SERVICE_URL
ENV VITE_PRODUCT_SERVICE_URL=$VITE_PRODUCT_SERVICE_URL
ENV VITE_ECOMMERCE_READ_SERVICE_URL=$VITE_ECOMMERCE_READ_SERVICE_URL
ENV VITE_ECOMMERCE_READ_GRAPHQL_URL=$VITE_ECOMMERCE_READ_GRAPHQL_URL
ENV VITE_SHIPPING_SERVICE_URL=$VITE_SHIPPING_SERVICE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
ENV VITE_MAP_PROVIDER=$VITE_MAP_PROVIDER
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API

ENV NODE_ENV=production

RUN npm run build

# ---- Runtime: static files + SPA fallback ----
# FROM nginx:1.27-alpine@sha256:<digest> # (uncomment in production) pin image digest
FROM nginx:1.27-alpine AS web

RUN apk add --no-cache curl

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1/health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]