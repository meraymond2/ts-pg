import * as Backend from "./backend-messages"
import { PasswordRequested, ReadyForQuery, Uninitialised } from "./states"
import { Socket } from "./socket"
import { hashMd5 } from "./utils"

export const sendStartup = async (_state: Uninitialised, socket: Socket): Promise<PasswordRequested> => {
  const replyFuture: Promise<Backend.Msg[]> = new Promise(async (res) =>
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
  if (reply.length > 1) throw Error("Got more messages than expected.")

  const msg = reply[0]
  switch (msg._tag) {
    case "AuthenticationMD5Password":
      return {
        _tag: "PasswordRequested",
        authType: "md5",
        salt: msg.salt,
      }
    default:
      throw Error("Unreachable")
  }
}

export const sendPassword = async (state: PasswordRequested, socket: Socket): Promise<ReadyForQuery> => {
  const repliesFuture: Promise<Backend.Msg[]> = new Promise(async (res) =>
    socket.send(
      {
        _tag: "PasswordMessage",
        password: hashMd5("michael", "cascat", state.salt),
      },
      res,
      ["ReadyForQuery"]
    )
  )
  const replies = await repliesFuture
  return replies.reduce<ReadyForQuery>(
    (acc, msg) => {
      switch (msg._tag) {
        case "ParameterStatus":
          acc.runtimeParams[msg.name] = msg.value
          return acc
        case "BackendKeyData":
          acc["cancellationKey"] = {
            pid: msg.pid,
            key: msg.secretKey,
          }
          return acc
        case "ReadyForQuery":
          acc["transactionStatus"] = msg.status
          return acc
        case "AuthenticationOk":
          return acc
        default:
          throw Error("Unexpected msg: " + JSON.stringify(msg))
      }
    },
    { _tag: "ReadyForQuery", runtimeParams: {}, cancellationKey: { pid: -1, key: -1 }, transactionStatus: "E" }
  )
}
