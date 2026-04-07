# Use the Dockerfile from the mqb directory
FROM node:20-bookworm AS builder
WORKDIR /app

COPY mqb/package.json ./
COPY mqb/package-lock.json ./
RUN npm install

COPY mqb/ .

ARG NEXT_PUBLIC_APP_URL=https://mieux-que-brad.onrender.com
ARG NEXT_PUBLIC_APP_NAME=MQB
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-bookworm AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY mqb/package.json ./
COPY mqb/package-lock.json ./
RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

RUN npm install tsx@4 --no-save && mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "cd /app && npx tsx src/db/migrate.ts && npm run bootstrap && npm run start"]
