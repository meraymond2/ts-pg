import { TransactionStatus } from "./backend-messages"

/* States */
export type State = Uninitialised | PasswordRequested

export type Uninitialised = {
  _tag: "Uninitialised"
}

export type PasswordRequested = {
  _tag: "PasswordRequested"
  authType: "md5"
  salt: Uint8Array
}

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
