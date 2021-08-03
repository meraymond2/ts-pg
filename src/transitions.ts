import * as Backend from "./backend-messages"
import { PasswordRequested, ReadyForQuery, Uninitialised } from "./states"
import { Socket } from "./socket"
import { hashMd5 } from "./utils"

export const sendStartup = async (
  _state: Uninitialised,
  socket: Socket
): Promise<PasswordRequested | ReadyForQuery> => {
  const repliesFuture: Promise<Backend.Msg[]> = new Promise(async (res) =>
    socket.send(
      {
        _tag: "StartupMessage",
        database: "dbname",
        majorVersion: 3,
        minorVersion: 0,
        user: "michael",
      },
      res,
      ["AuthenticationMD5Password", "AuthenticationCleartextPassword", "ReadyForQuery"]
    )
  )
  const replies = await repliesFuture
  const first = replies[0]
  switch (first._tag) {
    case "AuthenticationMD5Password":
      return {
        _tag: "PasswordRequested",
        authType: "md5",
        salt: first.salt,
      }
    case "AuthenticationCleartextPassword":
      return {
        _tag: "PasswordRequested",
        authType: "clear-text",
      }
    case "AuthenticationOk":
      return buildReadyForQuery(replies)
    default:
      throw Error("Unreachable")
  }
}

export const sendPassword = async (state: PasswordRequested, socket: Socket): Promise<ReadyForQuery> => {
  const repliesFuture: Promise<Backend.Msg[]> = new Promise(async (res) =>
    socket.send(
      {
        _tag: "PasswordMessage",
        password: state.authType === "md5" ? hashMd5("michael", "cascat", state.salt) : "cascat",
      },
      res,
      ["ReadyForQuery"]
    )
  )
  const replies = await repliesFuture
  return buildReadyForQuery(replies)
}

const buildReadyForQuery = (msgs: Backend.Msg[]): ReadyForQuery =>
  msgs.reduce<ReadyForQuery>(
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
