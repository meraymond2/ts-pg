To do:
- Remove hard-coded user/password/host/dbname/port and use config.
- Return the query result — the FSM attempt isn't working well here, because the results are a side effect of going from Ready -> Ready.
- Figure out if I can get the results in binary rather than text, it feels a little inefficient. — I think I can, but only for extended queries. Will continue to look.
- Figure out how I can map type-ids to types, so I can parse the results.

https://github.com/postgres/postgres/blob/master/src/include/catalog/pg_type.dat
The rust pkg auto generates the rust code from this file.

Thoughts:
- I like moving the aggregation to the caller, out of the socket. I don't need the channel, that can just be a callback. The caller can aggregate the replies.
- I like the FSM for the startup. It's bad for the query. I think it might be more useful for extended queries.
- I might make the client class, which owns the FSM and the socket, and keep them separate. I think the IO should live outside the FSM, if I had a regex, it wouldn't be responsible for reading from disk, you would read a file, and then feed it into the regex. So I can have the client, that sends a message to the socket with a callback, builds the replies into a list, and combines that with the FSM to get the next state. And the client uses the state to determine the next action.

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
