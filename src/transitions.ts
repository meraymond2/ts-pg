import * as Backend from "./backend-messages"
import { PasswordRequested, ReadyForQuery, Uninitialised } from "./states"

export const fromUnitialised = (
  state: Uninitialised,
  msgs: Backend.Msg[]
): PasswordRequested | ReadyForQuery => {
  const first = msgs[0]
  switch (first._tag) {
    case "AuthenticationMD5Password":
      return {
        _tag: "PasswordRequested",
        authType: "md5",
        user: state.user,
        salt: first.salt,
      }
    case "AuthenticationCleartextPassword":
      return {
        _tag: "PasswordRequested",
        authType: "clear-text",
      }
    case "AuthenticationOk":
      return buildReadyForQuery(msgs)
    default:
      throw Error("Unreachable")
  }
}

export const fromPasswordRequested = (
  _state: PasswordRequested,
  msgs: Backend.Msg[]
): ReadyForQuery => buildReadyForQuery(msgs)

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
    {
      _tag: "ReadyForQuery",
      runtimeParams: {},
      cancellationKey: { pid: -1, key: -1 },
      transactionStatus: "E",
    }
  )
