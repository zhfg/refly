# Base image
FROM node:20-alpine AS base

# Builder image
FROM base AS builder
WORKDIR /app

RUN npm install -g @microsoft/rush@5.125.0
COPY . .
RUN rush install --to @refly/api
RUN rush build --to @refly/api
RUN rush deploy --overwrite
RUN cd common/deploy/apps/api && rushx build

# Runner image
FROM base AS runner
WORKDIR /app

RUN apk --no-cache add curl
COPY --from=builder /app/common/deploy/apps/api/ .

CMD [ "node", "dist/main.js" ]
