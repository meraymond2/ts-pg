import * as Net from "net"
import * as Backend from "./backend-messages"
import * as Frontend from "./frontend-messages"
import { bytesToInt } from "./utils"

export class Socket {
  sock: Net.Socket
  callback: null | ((msg: Backend.Msg) => void)
  listeningFor: Backend.MsgType[]

  constructor() {
    let sock = new Net.Socket()

    sock.on("data", this.receive)

    sock.on("close", () => console.log("Socket closed."))

    this.sock = sock
    this.callback = null
    this.listeningFor = []
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

  send = (msg: Frontend.Msg, callback: (msg: Backend.Msg) => void, on: Backend.MsgType[]): void => {
    this.callback = callback
    this.listeningFor = on
    this.sock.write(Frontend.serialise(msg), (error) => error && console.error(`Failed to write to socket: ${error}`))
  }

  receive = (bytes: Uint8Array): void => {
    let remaining = bytes
    while (remaining.length > 0) {
      const msgLength = bytesToInt(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      const msg = Backend.deserialise(msgBytes)
      remaining = remaining.slice(1 + msgLength)
      if (this.listeningFor.includes(msg._tag) && this.callback) {
        // For now, assume well-behaved client, who waits for an answer before sending another request.
        const callback = this.callback
        this.callback = null
        this.listeningFor = []
        callback(msg)
      }
      console.log("Debug: ", msg)
    }
  }
}
