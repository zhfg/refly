# Refly API

## Docker Images

Prepare databases and start dev server:

```bash
docker-compose -f docker-compose.dev.yml up -d
yarn dev
```

Sync postgres schema:

```bash
yarn sync-db-schema
```

> Visit minio console on http://localhost:9001, with username and password specified in docker-compose.yml.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
