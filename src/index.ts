import { Socket } from "./socket"
import { State } from "./states"
import { sendStartup, sendPassword } from "./transitions"

const start: State = {
  _tag: "Uninitialised",
}

const socket = new Socket(true)

socket
  .init()
  .then(() => sendStartup(start, socket))
  .then((state) => (state._tag === "ReadyForQuery" ? state : sendPassword(state, socket)))
  .then(console.log)
