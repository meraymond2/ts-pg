import { PasswordRequested, Uninitialised } from "./states"
import { Socket } from "./socket"

/* Transitions */
export const sendStartup = async (state: Uninitialised, socket: Socket): Promise<PasswordRequested> => {
  const reply = await socket.send({
    _tag: "StartupMessage",
    database: "things",
    majorVersion: 3,
    minorVersion: 0,
    user: "michael",
  })
  console.log("Reply: " + reply)
  return {
    _tag: "PasswordRequested",
    authType: "md5",
  }
}
