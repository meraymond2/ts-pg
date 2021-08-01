import * as Net from "net"
import * as Backend from "./backend-messages"
import * as Frontend from "./frontend-messages"

export class Socket {
  sock: Net.Socket

  constructor() {
    let sock = new Net.Socket()

    sock.on("data", this.receive)

    sock.on("close", () => console.log("Socket closed."))
    this.sock = sock
  }

  init = async (): Promise<void> =>
    new Promise<void>((res, rej) => {
      this.sock.on("error", rej)
      this.sock.connect(5432, "localhost", () => {
        console.log("Socket connected.")
        this.sock.on("error", (error) => console.error(`Socket error: ${error}`))
        res()
      })
    })

  send = (msg: Frontend.Msg): void => {
    this.sock.write(Frontend.serialise(msg), (error) => error && console.error(`Failed to write to socket: ${error}`))
  }

  receive = (bytes: Uint8Array): void => {
    let remaining = bytes
    while (remaining.length > 0) {
      const msgLength = bytesToInt(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      const msg = Backend.deserialise(msgBytes)
      remaining = remaining.slice(1 + msgLength)
      // this.dispatch(deserialise(msgBytes))
      console.log("Received: " + JSON.stringify(msg))
    }
  }
}

const bytesToInt = (bytes: Uint8Array): number => (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
