import * as Net from "net"
import { deserialise } from "./deserialise"
import { FMessage } from "./messages"
import { serialise } from "./serialise"
import { dispatch, State, Unconnected } from "./state-machine"

export class Conn {
  sock: Net.Socket
  state: State

  constructor() {
    let sock = new Net.Socket()

    sock.connect(5432, "localhost", () => {
      console.log("Connection opened")
    })

    sock.on("data", this.receive)

    sock.on("close", () => console.log("Connection closed"))

    this.sock = sock
    this.state = Unconnected("root", "cervest", "assets")
  }

  receive = (bytes: Uint8Array): void => {
    let remaining = bytes
    while (remaining.length > 0) {
      const msgLength = parseInt(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      remaining = remaining.slice(1 + msgLength)
      const parsed = deserialise(msgBytes)
      this.state = dispatch(this.state, parsed)
    }
  }

  send = (msg: FMessage): void => {
    this.sock.write(serialise(msg), console.error)
  }
}

const parseInt = (bytes: Uint8Array): number => (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
