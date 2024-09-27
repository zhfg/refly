# Base image
FROM node:20-alpine

WORKDIR /app

RUN corepack enable
RUN npm install -g @microsoft/rush@5.125.0

COPY . .
RUN rush install --to @refly/api
RUN rush build --to @refly/api

EXPOSE 3000
CMD [ "node", "apps/api/dist/main.js" ]
