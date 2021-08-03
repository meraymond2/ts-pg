import { bytesToInt } from "./utils"

export type Msg =
  | AuthenticationMD5Password
  | AuthenticationCleartextPassword
  | AuthenticationOk
  | ParameterStatus
  | BackendKeyData
  | ReadyForQuery
  | ErrorResponse

export type MsgType =
  | "AuthenticationMD5Password"
  | "AuthenticationCleartextPassword"
  | "AuthenticationOk"
  | "ParameterStatus"
  | "BackendKeyData"
  | "ReadyForQuery"
  | "ErrorResponse"

export type AuthenticationMD5Password = {
  _tag: "AuthenticationMD5Password"
  salt: Uint8Array
}

export type AuthenticationCleartextPassword = {
  _tag: "AuthenticationCleartextPassword"
}

export type AuthenticationOk = { _tag: "AuthenticationOk" }

export type ParameterStatus = {
  _tag: "ParameterStatus"
  name: string
  value: string
}

export type BackendKeyData = {
  _tag: "BackendKeyData"
  pid: number
  secretKey: number
}

// idle, in transaction block, in failed transaction block
export type TransactionStatus = "I" | "T" | "E"

export type ReadyForQuery = {
  _tag: "ReadyForQuery"
  status: TransactionStatus
}

export type ErrorResponse = {
  _tag: "ErrorResponse"
  fields: Record<string, string>
}

/******************************************************************************/

export const deserialise = (bytes: Uint8Array): Msg => {
  const msgType = String.fromCharCode(bytes[0])
  switch (msgType) {
    case "E":
      return deserialiseErrorResponse(bytes)
    case "K":
      return deserialiseBackendKeyData(bytes)
    case "R":
      const authMsgType = bytes[8]
      switch (authMsgType) {
        case 0:
          return deserialiseAuthenticationOk(bytes)
        case 3:
          return deserialiseAuthenticationCleartextPassword(bytes)
        case 5:
          return deserialiseAuthenticationMD5Password(bytes)
        default:
          throw Error("Unimplemented auth request " + authMsgType)
      }
    case "S":
      return deserialiseParameterStatus(bytes)
    case "Z":
      return deserialiseReadyForQuery(bytes)
    default:
      throw Error("Unimplemented message type " + msgType)
  }
}

/**
 * Int8 'R'
 * Int32 Length
 * Int32 5
 * Bytes(4) Salt
 */
const deserialiseAuthenticationMD5Password = (bytes: Uint8Array): AuthenticationMD5Password => {
  const saltIdx = 1 + 4 + 4
  const salt = bytes.slice(saltIdx, saltIdx + 4)
  return { _tag: "AuthenticationMD5Password", salt }
}

/**
 * Int8 'R'
 * Int32 Length
 * Int32 3
 */
const deserialiseAuthenticationCleartextPassword = (bytes: Uint8Array): AuthenticationCleartextPassword => ({
  _tag: "AuthenticationCleartextPassword",
})

/**
 * Int8 'R'
 * Int32 Length
 * Int32 0
 */
const deserialiseAuthenticationOk = (bytes: Uint8Array): AuthenticationOk => ({
  _tag: "AuthenticationOk",
})

/**
 * Int8 'S'
 * Int32 Length
 * String Parameter Name
 * String Parameter Value
 */
const deserialiseParameterStatus = (bytes: Uint8Array): ParameterStatus => {
  let start = 5
  let end = start
  while (bytes[end] !== 0x00) end++
  const name = bytesToString(bytes.slice(start, end))
  start = end + 1
  end = start
  while (bytes[end] !== 0x00) end++
  const value = bytesToString(bytes.slice(start, end))
  return {
    _tag: "ParameterStatus",
    name,
    value,
  }
}

/**
 * Int8 'K'
 * Int32 Length
 * Int32 Process Id
 * Int32 Secret Key
 */
const deserialiseBackendKeyData = (bytes: Uint8Array): BackendKeyData => ({
  _tag: "BackendKeyData",
  pid: bytesToInt(bytes.slice(5, 9)),
  secretKey: bytesToInt(bytes.slice(9, 13)),
})

/**
 * Int8 'Z'
 * Int32 Length
 * Int8 Status
 */
const deserialiseReadyForQuery = (bytes: Uint8Array): ReadyForQuery => ({
  _tag: "ReadyForQuery",
  status: String.fromCharCode(bytes[5]) as TransactionStatus,
})

/**
 * Int8 'E'
 * Int32 Length
 * Int8 Error Field
 * String Field Value
 */
const deserialiseErrorResponse = (bytes: Uint8Array): ErrorResponse => {
  let idx = 5
  let fields: Record<string, string> = {}
  while (bytes[idx] !== 0x00) {
    const fieldId = String.fromCharCode(bytes[idx])
    idx++
    const start = idx
    while (bytes[idx] !== 0x00) idx++
    const value = bytesToString(bytes.slice(start, idx))
    const key: string | undefined = errorFields[fieldId]
    if (key) fields[key] = value
    idx++
  }
  return {
    _tag: "ErrorResponse",
    fields,
  }
}

/******************************************************************************/

const bytesToString = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder("utf-8")
  return decoder.decode(bytes)
}

// https://www.postgresql.org/docs/current/protocol-error-fields.html
const errorFields: Record<string, string> = {
  S: "severity",
  V: "severity",
  C: "code",
  M: "message",
  D: "detail",
  H: "hint",
  P: "position",
  p: "internal_position",
  W: "where",
  s: "schema",
  t: "table",
  c: "column",
  d: "data-type",
  n: "constraint",
  F: "file",
  L: "line",
  R: "routine",
}
