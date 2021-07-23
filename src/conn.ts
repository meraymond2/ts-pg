import * as Net from "net"
import { deserialise } from "./deserialise"
import { BMessage, FMessage, PasswordMessage, StartupMessage } from "./messages"
import { serialise } from "./serialise"
import { receivePasswordReq, sendStartup, State, Uninitialised } from "./states"
import { Md5 } from "ts-md5"

export class Conn {
  sock: Net.Socket
  state: State

  constructor(user: string, password: string, database: string) {
    let sock = new Net.Socket()

    sock.connect(5432, "localhost", () => {
      console.log("Connection opened")
    })

    sock.on("data", this.receive)

    sock.on("close", () => console.log("Connection closed"))

    this.sock = sock
    this.state = Uninitialised(user, password, database)
  }

  initialise = (): Promise<void> => {
    return new Promise((res, rej) => {
      if (this.state._tag === "Uninitialised") {
        this.sock.write(serialise(StartupMessage(this.state.user, this.state.database)))
        this.state = sendStartup(this.state.user, this.state.password, async () => res())
      } else {
        rej()
      }
    })
  }

  receive = (bytes: Uint8Array): void => {
    let remaining = bytes
    while (remaining.length > 0) {
      const msgLength = parseInt(remaining.slice(1, 5))
      const msgBytes = remaining.slice(0, 1 + msgLength)
      remaining = remaining.slice(1 + msgLength)
      this.dispatch(deserialise(msgBytes))
    }
  }

  dispatch = (msg: BMessage): void => {
    switch (this.state._tag) {
      case "StartupSent":
        switch (msg._tag) {
          case "AuthenticationMD5Password": {
            const { user, password } = this.state
            this.state = receivePasswordReq(this.state.callback)
            this.send(PasswordMessage(hashPassword(user, password, msg.salt)))
          }
        }
      case "PasswordRequested":
        switch (msg._tag) {
          case "AuthenticationOk": {
            this.state.callback()
            console.log("hooray")
          }
        }
    }
  }

  send = (msg: FMessage): void => {
    this.sock.write(serialise(msg), console.error)
  }
}

const parseInt = (bytes: Uint8Array): number => (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]

const hashPassword = (user: string, password: string, salt: Uint8Array): string => {
  let hash = new Md5()
  hash.appendAsciiStr(password)
  hash.appendAsciiStr(user)
  let hashed: string = hash.end() as string
  hash = new Md5()
  hash.appendStr(hashed)
  hash.appendByteArray(salt)
  hashed = hash.end() as string
  return "md5" + hashed
}
