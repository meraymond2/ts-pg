import * as fs from "fs"
import * as Backend from "./backend-messages"
import { Connection as Conn } from "./connection"

const conn = Conn.init({
  host: "localhost",
  port: 5432,
  database: "dbname",
  user: "michael",
  password: "cascat",
})

conn.then((conn) => {
  conn
    .query("SELECT * FROM cats")
    .then(console.log)
    .then(() => {
      conn.close()
    })
})
