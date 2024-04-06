# Refly API

## Docker Images

Prepare database:

```bash
docker-compose up -d
```

Run database migrations:

```bash
npx prisma migrate deploy
```

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
