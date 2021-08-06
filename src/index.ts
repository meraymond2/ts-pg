import { Connection as Conn } from "./connection"

const conn = Conn.init({
  host: "localhost",
  port: 5432,
  database: "dbname",
  user: "michael",
  password: "cascat",
})

conn.then((conn) => {
  conn.query("SELECT * FROM pg_type").then(console.log)
})
