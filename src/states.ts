import { TransactionStatus } from "./backend-messages"

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
  transactionStatus: TransactionStatus
}
