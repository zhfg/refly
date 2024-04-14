# Refly API

## Docker Images

Prepare database:

```bash
docker-compose up -d
```

Run database migrations:

```bash
npx prisma migrate diff --from-url 'postgresql://refly:test@localhost:5432/refly?schema=refly' --to-schema-datamodel prisma/schema.prisma --script | npx prisma db execute --stdin
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
