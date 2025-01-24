# Builder stage
FROM node:20-alpine@sha256:b5b9467fe7b33aad47f1ec3f6e0646a658f85f05c18d4243024212a91f3b7554 AS builder

WORKDIR /app

RUN corepack enable

ENV VITE_API_URL=http://localhost:5800
ENV VITE_COLLAB_URL=http://localhost:5801

COPY . .
RUN pnpm install
RUN pnpm build:web

# Nginx stage
FROM nginx:alpine

# Copy nginx configuration
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
