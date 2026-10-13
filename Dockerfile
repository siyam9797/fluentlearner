FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads \
    PUBLIC_UPLOAD_URL=/uploads
WORKDIR /app
COPY --from=builder --chown=node:node /app/client/.next/standalone ./
COPY --from=builder --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=node:node /app/client/public ./client/public
COPY --from=builder --chown=node:node /app/server/scripts/seed-admin.mjs ./server/scripts/seed-admin.mjs
COPY --from=builder --chown=node:node /app/node_modules/dotenv ./node_modules/dotenv
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN printf '{"type":"commonjs"}\n' > /app/client/package.json \
    && mkdir -p /data/uploads \
    && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["sh", "./docker-entrypoint.sh"]
