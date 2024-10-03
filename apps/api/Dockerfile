# Base image
FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY . .
RUN pnpm install
RUN pnpm run build

EXPOSE 3000
CMD [ "node", "apps/api/dist/main.js" ]
