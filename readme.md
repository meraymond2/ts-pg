To do:
- Node should have a UTF8 text encoder built in. Should use that instead from String.fromCharCode.
- Handle no-password and clear-text password auth. Check how complicated the sha256 auth is (and what RDS uses).
- See about handling some error messages, such as bad user, password, dbname.
- Remove hard-coded user/password/host/dbname/port and use config.

# Running Locally
```
# MD5 Auth
docker run --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname postgres:13

# No Auth
docker run --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname -e POSTGRES_HOST_AUTH_METHOD=trust postgres:13

# SHA 246 Auth
docker run --name pgdb -p 5432:5432 -e POSTGRES_USER=michael -e POSTGRES_PASSWORD=cascat -e POSTGRES_DB=dbname -e POSTGRES_HOST_AUTH_METHOD=scram-sha-256 POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256 postgres:13
```

# Documentation
https://www.postgresql.org/docs/current/protocol.html
https://www.postgresql.org/docs/current/protocol-message-formats.html

https://hub.docker.com/_/postgres/
