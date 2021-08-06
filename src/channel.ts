import * as Net from "net"
import * as Backend from "./backend-messages"
import * as Frontend from "./frontend-messages"
import { bytesToInt32, log } from "./utils"

type ReadCallback = (msg: Backend.Msg) => void

export class Channel {
  private debug: boolean
  private outBuffer: Backend.Msg[]
  private socket: Net.Socket
  private waitingQueue: ReadCallback[]

  constructor(debug: boolean = false) {
    const socket = new Net.Socket()

    socket.on("data", this.parseData)

    socket.on("close", () => log.info("Socket closed."))

    this.debug = debug
    this.socket = socket
    this.outBuffer = []
    this.waitingQueue = []
  }

  init = (host: string, port: number): Promise<void> =>
    new Promise<void>((res, rej) => {
      this.socket.on("error", rej)
      this.socket.connect(port, host, () => {
        log.info("Socket connected.")
        this.socket.on("error", (error) => console.error(`Socket error: ${error}`))
        return res()
      })
    })

  write = (msg: Frontend.Msg): void => {
    this.socket.write(
      Frontend.serialise(msg),
      (error) => error && log.error(`Socket error: ${error}`)
    )
  }

  read = (): Promise<Backend.Msg> =>
    new Promise((res) => {
      if (this.outBuffer.length) {
        return res(this.outBuffer.shift() as Backend.Msg)
      } else {
        this.waitingQueue.push(res)
      }
    })

  private parseData = (bytes: Uint8Array): void => {
    let remaining = bytes
    // TODO: handle partial messages.
    // Probably needs a byte buffer where it can store parts of messages
    // until it has enough to form a whole one. Currently in large queries
    // it will cut off halfway and break the deserialiser.
    while (remaining.length > 0) {
      const msgLength = bytesToInt32(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      const msg = Backend.deserialise(msgBytes)
      remaining = remaining.slice(1 + msgLength)

      if (this.debug) log.info(msg)
      if (this.waitingQueue.length) {
        const res = this.waitingQueue.shift() as ReadCallback
        res(msg)
      } else {
        this.outBuffer.push(msg)
      }
    }
  }
}
