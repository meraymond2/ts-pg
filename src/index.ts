import { Socket } from "./socket"
import { State } from "./states"
import { sendStartup, sendPassword, sendQuery } from "./transitions"

const start: State = {
  _tag: "Uninitialised",
}

const socket = new Socket(true)

socket
  .init()
  .then(() => sendStartup(start, socket))
  .then((state) => (state._tag === "ReadyForQuery" ? state : sendPassword(state, socket)))
  .then((state) => sendQuery(state, "SELECT * FROM cats", socket))
  .then(console.log)
