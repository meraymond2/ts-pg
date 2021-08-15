# ts-pg
A Postgres client library in TypeScript.

It only implements a subset of features, but enough that would allow a client application to query a Postgres database.

Currently, it does not support:
- transactions
- copying
- parsing all types, e.g. JSON, arrays
- all authentication methods

## Example
```typescript
const main = async () => {
  const conn = await Conn.init({
    host: "localhost",
    port: 5432,
    database: "dbname",
    user: "michael",
    password: "cascat",
  })

  await conn.simpleQuery("CREATE TABLE cats ( name text )")
  const desc = await conn.describe("cats")
  const res = await conn.extendedQuery("SELECT * FROM cats WHERE name = $1", ["Cas"])

  console.log(desc)
  return res
}
```

## Why?
For personal education, to learn more about Postgres and as a prepatory study for [casql](https://github.com/meraymond2/casql). It is not intended for serious use.

## Running Locally
There are example commands in `index.ts`.
```
# Start a Postgres container
docker run --rm --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname postgres:13

# Run the entrypoint
npm install
npm start
```

## Documentation
https://www.postgresql.org/docs/current/protocol.html
https://www.postgresql.org/docs/current/protocol-flow.html
https://www.postgresql.org/docs/current/protocol-message-formats.html

https://hub.docker.com/_/postgres/
