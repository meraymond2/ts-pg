import { Conn } from "./conn"

const conn = new Conn("root", "cervest", "assets")

setTimeout(() => {
  const res = conn.initialise()
  res.then(() => {
    console.log("done")
  })
}, 2000)
