import * as Backend from "./backend-messages"
import { PasswordRequested, Uninitialised } from "./states"
import { Socket } from "./socket"
import { hashMd5 } from "./utils"

export const sendStartup = async (_state: Uninitialised, socket: Socket): Promise<PasswordRequested> => {
  const replyFuture: Promise<Backend.Msg> = new Promise(async (res) =>
    socket.send(
      {
        _tag: "StartupMessage",
        database: "dbname",
        majorVersion: 3,
        minorVersion: 0,
        user: "michael",
      },
      res,
      ["AuthenticationMD5Password"]
    )
  )
  const reply = await replyFuture
  switch (reply._tag) {
    case "AuthenticationMD5Password":
      return {
        _tag: "PasswordRequested",
        authType: "md5",
        salt: reply.salt,
      }
    default:
      throw Error("Unreachable")
  }
}

export const sendPassword = async (state: PasswordRequested, socket: Socket): Promise<any> =>
  new Promise(async (res) =>
    socket.send(
      {
        _tag: "PasswordMessage",
        password: hashMd5("michael", "cascat", state.salt),
      },
      res,
      ["AuthenticationOk"]
    )
  )
