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
