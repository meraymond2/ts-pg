import { Conn } from "./conn"

const conn = Conn.initialise("root", "cervest", "assets")

console.log(conn)

conn.then(() => {
  console.log(conn)
})
