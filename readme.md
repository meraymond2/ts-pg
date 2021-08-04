To do:
- Remove hard-coded user/password/host/dbname/port and use config.
- Return the query result — the FSM attempt isn't working well here, because the results are a side effect of going from Ready -> Ready.
- Figure out if I can get the results in binary rather than text, it feels a little inefficient.
- Figure out how I can map type-ids to types, so I can parse the results.

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
