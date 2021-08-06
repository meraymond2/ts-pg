To do:
- Return the query result — the question is whether I use hard-coded types, or query the `pg_type` table on startup.
- Figure out if I can get the results in binary rather than text, it feels a little inefficient. — I think I can, but only for extended queries. Will continue to look.

https://github.com/postgres/postgres/blob/master/src/include/catalog/pg_type.dat
The rust pkg auto generates the rust code from this file.

Notes:
- I'm pretty sure that it is a single query at a time per connection. In Rust, it would be easier to prevent asking another query without waiting on the first, because you could consume the client each time. In JS, I could probably implement a FIFO queue?

# Running Locally
```
# MD5 Auth
docker run --rm --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname postgres:13

# No Auth
docker run --rm --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname -e POSTGRES_HOST_AUTH_METHOD=trust postgres:13

# Cleartext
docker run --rm --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname -e POSTGRES_HOST_AUTH_METHOD=password postgres:13

# SHA 246 Auth (don’t know what this is)
docker run --rm --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname -e POSTGRES_HOST_AUTH_METHOD=scram-sha-256 -e POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256 postgres:13
```

# Documentation
https://www.postgresql.org/docs/current/protocol.html
https://www.postgresql.org/docs/current/protocol-flow.html
https://www.postgresql.org/docs/current/protocol-message-formats.html

https://hub.docker.com/_/postgres/

create table cats ( name text, age int ) ;
insert into cats (name, age) values ('Cascat', 5);
insert into cats (name, age) values ('Luna', 4);
