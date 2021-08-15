import * as Backend from "./backend-messages"

/* States */
export type State = Uninitialised | PasswordRequested | ReadyForQuery

export type Uninitialised = {
  _tag: "Uninitialised"
  user: string
  database: string | undefined
}

export const isUninitialised = (state: State): state is Uninitialised =>
  state._tag === "Uninitialised"

export type PasswordRequested =
  | {
      _tag: "PasswordRequested"
      authType: "md5"
      user: string
      salt: Uint8Array
    }
  | {
      _tag: "PasswordRequested"
      authType: "clear-text"
    }

export const isPasswordRequested = (state: State): state is PasswordRequested =>
  state._tag === "PasswordRequested"

type CancellationKey = {
  pid: number
  key: number
}

export type ReadyForQuery = {
  _tag: "ReadyForQuery"
  runtimeParams: Record<string, string>
  cancellationKey: CancellationKey
  transactionStatus: Backend.TransactionStatus
}

/* Transitions */
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
      throw Error("Unreachable (2)")
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
