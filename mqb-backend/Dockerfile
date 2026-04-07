FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /data

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
