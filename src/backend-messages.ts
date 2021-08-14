import { bytesToInt16, bytesToInt32 } from "./utils"

export type Msg =
  | AuthenticationMD5Password
  | AuthenticationCleartextPassword
  | AuthenticationOk
  | ParameterStatus
  | BackendKeyData
  | ReadyForQuery
  | RowDescription
  | ParameterDescription
  | DataRow
  | Close
  | EmptyQueryResponse
  | ErrorResponse
  | ParseComplete
  | BindComplete

export type MsgType =
  | "AuthenticationMD5Password"
  | "AuthenticationCleartextPassword"
  | "AuthenticationOk"
  | "ParameterStatus"
  | "BackendKeyData"
  | "ReadyForQuery"
  | "RowDescription"
  | "ParameterDescription"
  | "DataRow"
  | "Close"
  | "ErrorResponse"
  | "ParseComplete"
  | "BindComplete"

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

// I still haven’t answered my question as to how you identify the type. You can
// look them up `SELECT * FROM pg_type WHERE oid = 25;` but I don’t know if they
// are stable enough to be able to skip that. Presumably.
export type FieldDescription = {
  fieldName: string
  tableOid: number
  column: number
  dataTypeOid: number
  dataTypeSize: number
  typeModifier: number
  formatCode: "text" | "binary"
}

export type RowDescription = {
  _tag: "RowDescription"
  fields: FieldDescription[]
}

export type ParameterDescription = {
  _tag: "ParameterDescription"
  oids: number[]
}

export type DataRow = {
  _tag: "DataRow"
  values: Array<null | Uint8Array>
}

export type EmptyQueryResponse = {
  _tag: "EmptyQueryResponse"
}

export type Close = {
  _tag: "Close"
  type: "statement" | "portal"
  name: string
}

export type ErrorResponse = {
  _tag: "ErrorResponse"
  fields: Record<string, string>
}

export type ParseComplete = {
  _tag: "ParseComplete"
}

export type BindComplete = {
  _tag: "BindComplete"
}

/******************************************************************************/

export const deserialise = (bytes: Uint8Array): Msg => {
  const msgType = String.fromCharCode(bytes[0])
  switch (msgType) {
    case "1":
      return deserialiseParseComplete(bytes)
    case "2":
      return deserialiseBindComplete(bytes)
    case "C":
      return deserialiseClose(bytes)
    case "D":
      return deserialiseDataRow(bytes)
    case "E":
      return deserialiseErrorResponse(bytes)
    case "I":
      return deserialiseEmptyQueryResponse(bytes)
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
    case "T":
      return deserialiseRowDescription(bytes)
    case "Z":
      return deserialiseReadyForQuery(bytes)
    case "t":
      return deserialiseParameterDescription(bytes)
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
const deserialiseAuthenticationMD5Password = (bytes: Uint8Array): AuthenticationMD5Password => ({
  _tag: "AuthenticationMD5Password",
  salt: bytes.slice(9, 13),
})

/**
 * Int8 'R'
 * Int32 Length
 * Int32 3
 */
const deserialiseAuthenticationCleartextPassword = (
  bytes: Uint8Array
): AuthenticationCleartextPassword => ({
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
  const arr = Array.from(bytes.slice(5))
  const name = consumeCStr(arr)
  const value = consumeCStr(arr)
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
const deserialiseBackendKeyData = (bytes: Uint8Array): BackendKeyData => {
  const arr = Array.from(bytes.slice(5))
  const pid = consumeInt32(arr)
  const secretKey = consumeInt32(arr)
  return {
    _tag: "BackendKeyData",
    pid,
    secretKey,
  }
}

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
 * Int8 'T'
 * Int32 Length
 * Int16 Number of Fields
 *
 * String Field Name
 * Int32 Table OID
 * Int16 Column #
 * Int32 Data Type OID
 * Int16 Data Type Size
 * Int32 Type Modifier
 * Int16 Format Code
 */
const deserialiseRowDescription = (bytes: Uint8Array): RowDescription => {
  const arr = Array.from(bytes.slice(5))
  const fieldCount = consumeInt16(arr)
  let fields: FieldDescription[] = []
  let i = 0
  while (i < fieldCount) {
    const fieldName = consumeCStr(arr)
    const tableOid = consumeInt32(arr)
    const column = consumeInt16(arr)
    const dataTypeOid = consumeInt32(arr)
    const dataTypeSize = consumeInt16(arr)
    const typeModifier = consumeInt32(arr)
    const formatCode = consumeInt16(arr)
    fields.push({
      fieldName,
      tableOid,
      column,
      dataTypeOid,
      dataTypeSize,
      typeModifier,
      formatCode: formatCode === 0 ? "text" : "binary",
    })
    i = i + 1
  }
  return {
    _tag: "RowDescription",
    fields,
  }
}

const deserialiseParameterDescription = (bytes: Uint8Array): ParameterDescription => {
  const arr = Array.from(bytes.slice(5))
  const paramCount = consumeInt16(arr)
  let i = 0
  let oids = []
  while (i < paramCount) {
    oids.push(consumeInt32(arr))
    i = i + 1
  }
  return {
    _tag: "ParameterDescription",
    oids,
  }
}

/**
 * Int8 'D'
 * Int32 Length
 * Int16 Number of Values
 *
 * Int32 Value Length (NULL is -1)
 * Bytes Column Value
 */
const deserialiseDataRow = (bytes: Uint8Array): DataRow => {
  const arr = Array.from(bytes.slice(5))
  const rowCount = consumeInt16(arr)
  let values: Array<null | Uint8Array> = []
  let i = 0
  while (i < rowCount) {
    const len = consumeInt32(arr)
    if (len === -1) {
      values.push(null)
    } else {
      values.push(new Uint8Array(arr.splice(0, len)))
    }
    i = i + 1
  }
  return {
    _tag: "DataRow",
    values,
  }
}

/**
 * Int8 '1'
 * Int32 Length
 */
const deserialiseParseComplete = (bytes: Uint8Array): ParseComplete => {
  return { _tag: "ParseComplete" }
}

/**
 * Int8 '2'
 * Int32 Length
 */
const deserialiseBindComplete = (bytes: Uint8Array): BindComplete => {
  return { _tag: "BindComplete" }
}

/**
 * Int8 'C'
 * Int32 Length
 * Int8 'S' (Stmt) or 'P' (Portal)
 * String Name
 */
const deserialiseClose = (bytes: Uint8Array): Close => {
  const arr = Array.from(bytes.slice(5))
  const type = consumeStr(arr, 1)
  // The name appears to include the fifth byte.
  const name = type + consumeCStr(arr)
  return {
    _tag: "Close",
    type: type === "S" ? "statement" : "portal",
    name,
  }
}

/**
 * Int8 'C'
 * Int32 Length
 */
const deserialiseEmptyQueryResponse = (_bytes: Uint8Array): EmptyQueryResponse => ({
  _tag: "EmptyQueryResponse",
})

/**
 * Int8 'E'
 * Int32 Length
 * Int8 Error Field
 * String Field Value
 * Null Terminator
 */
const deserialiseErrorResponse = (bytes: Uint8Array): ErrorResponse => {
  const arr = Array.from(bytes.slice(5))
  let fields: Record<string, string> = {}

  while (arr.length > 1) {
    const fieldId = String.fromCharCode(arr.shift() as number)
    const value = consumeCStr(arr)
    const key: string | undefined = errorFields[fieldId]
    if (key) fields[key] = value
  }

  return {
    _tag: "ErrorResponse",
    fields,
  }
}

/******************************************************************************/

// Mutating helpers, to avoid having to keep track of positions everywhere.
// I don’t like these, I’d prefer to use slices of the Uint8Array, but I also
// don’t want to assign a new pos var after each slice. Hmmm.
const consumeCStr = (byteArr: number[]): string => {
  let i = 0
  while (byteArr[i] !== 0x00) {
    i = i + 1
  }
  const strBytes = byteArr.splice(0, i)
  byteArr.shift() // null terminator
  const decoder = new TextDecoder("utf-8")
  return decoder.decode(new Uint8Array(strBytes))
}

const consumeStr = (byteArr: number[], len: number): string => {
  const strBytes = byteArr.splice(0, len)
  const decoder = new TextDecoder("utf-8")
  return decoder.decode(new Uint8Array(strBytes))
}

const consumeInt32 = (byteArr: number[]): number => {
  const intBytes = byteArr.splice(0, 4)
  return bytesToInt32(intBytes)
}

const consumeInt16 = (byteArr: number[]): number => {
  const intBytes = byteArr.splice(0, 2)
  return bytesToInt16(intBytes)
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
