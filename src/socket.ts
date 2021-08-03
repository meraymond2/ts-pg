import * as Net from "net"
import * as Backend from "./backend-messages"
import * as Frontend from "./frontend-messages"
import { bytesToInt32, log } from "./utils"

export class Socket {
  debug: boolean
  sock: Net.Socket
  resolve: null | ((msg: Backend.Msg[]) => void)
  msgs: Backend.Msg[]
  until: Backend.MsgType[]

  constructor(debug: boolean = false) {
    let sock = new Net.Socket()

    sock.on("data", this.receive)

    sock.on("close", () => log.info("Socket closed."))

    this.debug = debug
    this.sock = sock
    this.resolve = null
    this.msgs = []
    this.until = []
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

  send = (msg: Frontend.Msg, resolve: (msg: Backend.Msg[]) => void, until: Backend.MsgType[]): void => {
    this.resolve = resolve
    this.until = until
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
      if (this.until.includes(msg._tag) && this.resolve) {
        // For now, assume well-behaved client, who waits for an answer before sending another request.
        // Later, I'll see if it's possible to break this.
        const resolve = this.resolve
        const msgs = this.msgs.concat(msg)
        this.resolve = null
        this.msgs = []
        this.until = []
        resolve(msgs)
      } else if (this.resolve) {
        this.msgs.push(msg)
      } else {
        log.error("Uncaught message: ", msg)
      }
    }
  }
}
