FROM oven/bun:1 AS build

ARG VITE_API_URL
ARG VITE_PAYSTACK_PUBLIC_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PAYSTACK_PUBLIC_KEY=$VITE_PAYSTACK_PUBLIC_KEY

WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server/server.js"]
