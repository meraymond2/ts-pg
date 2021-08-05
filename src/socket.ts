import * as Net from "net"
import * as Backend from "./backend-messages"
import * as Frontend from "./frontend-messages"
import { Channel } from "./channel"
import { bytesToInt32, log } from "./utils"

export class Socket {
  debug: boolean
  sock: Net.Socket
  outChannel: null | Channel<Backend.Msg>

  constructor(debug: boolean = false) {
    let sock = new Net.Socket()

    sock.on("data", this.receive)

    sock.on("close", () => log.info("Socket closed."))

    this.debug = debug
    this.sock = sock
    this.outChannel = null
  }

  init = async (): Promise<void> =>
    new Promise<void>((res, rej) => {
      this.sock.on("error", rej)
      this.sock.connect(5432, "localhost", () => {
        log.info("Socket connected.")
        this.sock.on("error", (error) => console.error(`Socket error: ${error}`))
        res()
      })
    })

  send = (msg: Frontend.Msg, outChannel: Channel<Backend.Msg>): void => {
    this.outChannel = outChannel
    this.sock.write(Frontend.serialise(msg), (error) => error && log.error(`Failed to write to socket: ${error}`))
  }

  receive = (bytes: Uint8Array): void => {
    let remaining = bytes
    while (remaining.length > 0) {
      const msgLength = bytesToInt32(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      const msg = Backend.deserialise(msgBytes)
      remaining = remaining.slice(1 + msgLength)
      if (this.debug) log.info(msg)
      this.outChannel.push(msg)
    }
  }
}
