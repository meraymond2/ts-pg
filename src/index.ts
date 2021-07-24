import { Conn } from "./conn"

const conn = new Conn("root", "cervest", "assets")

conn.initialise().then(() => {
  console.log(conn)
})
