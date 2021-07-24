import * as Net from "net"
import { deserialise } from "./deserialise"
import { BMessage, FMessage, PasswordMessage, StartupMessage } from "./messages"
import { serialise } from "./serialise"
import { passwordAuthorised, receivePasswordReq, sendStartup, State, Uninitialised, ConnectCallback } from "./states"
import { Md5 } from "ts-md5"

export class Conn {
  sock: Net.Socket
  state: State

  constructor(user: string, password: string, database: string) {
    let sock = new Net.Socket()
    const startingState: Uninitialised = {
      _tag: "Uninitialised",
      user,
      password,
      database,
    }

    sock.on("data", this.receive)

    sock.on("close", () => console.log("Connection closed"))

    this.sock = sock
    this.state = startingState
  }

  initialise = async (): Promise<void> => {
    const socketConnected = new Promise<void>((res) => {
      this.sock.connect(5432, "localhost", () => {
        console.log("Connection opened")
        res()
      })
    })
    await socketConnected
    return new Promise((res, rej) => {
      if (this.state._tag === "Uninitialised") {
        this.send(StartupMessage(this.state.user, this.state.database))
        this.state = sendStartup(this.state, async () => res())
      } else {
        rej()
      }
    })
  }

  send = (msg: FMessage): void => {
    this.sock.write(serialise(msg), console.error)
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
    console.log(this.state._tag, msg._tag)
    switch (this.state._tag) {
      case "StartupSent":
        switch (msg._tag) {
          case "AuthenticationMD5Password": {
            const { user, password } = this.state
            this.state = receivePasswordReq(this.state, "md5")
            this.send(PasswordMessage(hashPassword(user, password, msg.salt)))
            return
          }
          default:
            return
        }
      case "PasswordRequested":
        switch (msg._tag) {
          case "AuthenticationOk": {
            const onConnect = this.state.onConnect
            this.state = passwordAuthorised(this.state)
            onConnect()
            return
          }
          default:
            return
        }
      default:
        return
    }
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
