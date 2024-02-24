# Refly API

## Docker Images

Prepare MongoDB:

```bash
docker run --name mongodb -d -p 27017:27017 mongo mongod --replSet rs0
docker exec -it mongodb mongosh
```

Then in the Mongo Shell, run following command:

```
rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})
```

Prepare Redis Stack:

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

Visit [RedisInsight](http://localhost:8001/redis-stack/browser) for stored data in detail.

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
