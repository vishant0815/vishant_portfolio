# Production image for the Next.js frontend (standalone server).
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are baked into the browser code at build time.
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_ANALYTICS_URL=""
# Used only while building, to prerender pages with real content. At runtime the
# container talks to the backends over the private Docker network instead.
ARG CONTENT_API_URL=""
ARG ANALYTICS_API_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ANALYTICS_URL=$NEXT_PUBLIC_ANALYTICS_URL \
    CONTENT_API_URL=$CONTENT_API_URL \
    ANALYTICS_API_URL=$ANALYTICS_API_URL
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

# Runs as the unprivileged "node" user that ships with the image.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
