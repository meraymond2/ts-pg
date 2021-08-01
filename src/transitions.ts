import * as Backend from "./backend-messages"
import { PasswordRequested, Uninitialised } from "./states"
import { Socket } from "./socket"

/* Transitions */
export const sendStartup = async (_state: Uninitialised, socket: Socket): Promise<PasswordRequested> => {
  const resp: Promise<Backend.Msg> = new Promise(async (res) =>
    socket.send(
      {
        _tag: "StartupMessage",
        database: "things",
        majorVersion: 3,
        minorVersion: 0,
        user: "michael",
      },
      res,
      ["AuthenticationMD5Password"]
    )
  )
  const reply = await resp
  switch (reply._tag) {
    case "AuthenticationMD5Password":
      return {
        _tag: "PasswordRequested",
        authType: "md5",
      }
    default:
      throw Error("Unreachable")
  }
}
