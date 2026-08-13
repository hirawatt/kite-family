# Multi-stage Dockerfile for Hono App (Coolify / Self-hosted)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# Create persistent data directory for token storage
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]
