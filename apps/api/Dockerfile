# Base image
FROM node:20-alpine@sha256:b5b9467fe7b33aad47f1ec3f6e0646a658f85f05c18d4243024212a91f3b7554

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

RUN npm install -g pnpm@8.15.8

COPY . .
RUN pnpm install
RUN pnpm build:api

EXPOSE 3000
CMD [ "node", "apps/api/dist/main.js" ]
