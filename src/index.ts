import { StartupMessage } from "./messages"
import { Conn } from "./socket"

const conn = new Conn()

setTimeout(() => {
  conn.send(StartupMessage("root", "assets"))
}, 2000)
