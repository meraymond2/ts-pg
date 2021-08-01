import { Socket } from "./socket"
import { State } from "./states"
import { sendStartup } from "./transitions"

const start: State = {
  _tag: "Uninitialised",
}

const socket = new Socket()

socket
  .init()
  .then(() => sendStartup(start, socket))
  .then(console.log)
