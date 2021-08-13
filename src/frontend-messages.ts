import { TSType } from "./pg_types"

export type Msg = StartupMessage | PasswordMessage | Query | Parse | Bind | Close | Execute | Sync

export type StartupMessage = {
  _tag: "StartupMessage"
  majorVersion: 3
  minorVersion: 0
  user: string
  database: string
}

export type PasswordMessage = {
  _tag: "PasswordMessage"
  password: string
}

export type Query = {
  _tag: "Query"
  query: string
}

export type Parse = {
  _tag: "Parse"
  name: string
  query: string
  types: number[] // oids
}

export type Bind = {
  _tag: "Bind"
  portal: string
  stmt: string
  params: TSType[]
}

export type Close = {
  _tag: "Close"
  toClose: "portal" | "statement"
  name: string
}

export type Execute = {
  _tag: "Execute"
  portal: string
  maxRows: number
}

export type Sync = {
  _tag: "Sync"
}

/******************************************************************************/

export const serialise = (msg: Msg): Uint8Array => {
  switch (msg._tag) {
    case "Bind":
      return serialiseBind(msg)
    case "Close":
      return serialiseClose(msg)
    case "Execute":
      return serialiseExecute(msg)
    case "Query":
      return serialiseQuery(msg)
    case "Parse":
      return serialiseParse(msg)
    case "PasswordMessage":
      return serializePasswordMessage(msg)
    case "StartupMessage":
      return serialiseStartupMessage(msg)
    case "Sync":
      return serialiseSync(msg)
  }
}

/**
 * Int32 Length
 * Int16 Major Protocol Version
 * Int16 Minor Protocol Version
 * CString[]: user <user> password <password>
 * Null Final Byte
 */
const serialiseStartupMessage = (msg: StartupMessage): Uint8Array => {
  const params = ["user", msg.user, "database", msg.database]
  const len = 4 + 2 + 2 + params.reduce((acc, param) => acc + clen(param), 0) + 1
  let buf = new Uint8Array(len)
  spliceInt(buf, 0, len, 4)
  spliceInt(buf, 4, msg.majorVersion, 2)
  spliceInt(buf, 6, msg.minorVersion, 2)
  let i = 8
  params.forEach((param) => {
    spliceStr(buf, i, param)
    i = i + clen(param)
  })
  buf[i] = 0x00
  return buf
}

/**
 * Int8 'p'
 * Int32 Length
 * CString hashed password
 */
const serializePasswordMessage = (msg: PasswordMessage): Uint8Array => {
  const len = 4 + clen(msg.password)
  let buf = new Uint8Array(1 + len)
  buf[0] = "p".charCodeAt(0)
  spliceInt(buf, 1, len, 4)
  spliceStr(buf, 5, msg.password)
  return buf
}

/**
 * Int8 'Q'
 * Int32 Length
 * CString Simple Query
 */
const serialiseQuery = (msg: Query): Uint8Array => {
  const len = 4 + clen(msg.query)
  let buf = new Uint8Array(1 + len)
  buf[0] = "Q".charCodeAt(0)
  spliceInt(buf, 1, len, 4)
  spliceStr(buf, 5, msg.query)
  return buf
}

/**
 * Int8 'P'
 * Int32 Length
 * CString Prepared Stmt Name
 * CString Query String
 * Int16 Number of Specified Types
 * Int32[] Type Oids
 */
const serialiseParse = (msg: Parse): Uint8Array => {
  const nameLen = clen(msg.name)
  const queryLen = clen(msg.query)
  const len = 4 + nameLen + queryLen + 2 + 4 * msg.types.length
  let buf = new Uint8Array(1 + len)
  buf[0] = "P".charCodeAt(0)
  spliceInt(buf, 1, len, 4)
  spliceStr(buf, 5, msg.name)
  spliceStr(buf, 5 + nameLen, msg.query)
  spliceInt(buf, 5 + nameLen + queryLen, msg.types.length, 2)
  let idx = 0
  while (idx < msg.types.length) {
    const pos = 5 + nameLen + queryLen + 2 + idx * 4
    spliceInt(buf, pos, msg.types[idx], 4)
    idx = idx + 1
  }
  return buf
}

/**
 * Int8 'B'
 * Int32 Length
 * CString Destination Portal
 * CString Prepared Statement
 * Int16 Number of Param Format Codes (n)
 * Int16[] n Format Codes
 * Int16 Number of Param Values
 * [Int32 Bytes][] Length of Param Value, Param Value
 * Int16 Number of Result Format Codes (k)
 * Int16[] k Format Codes
 */
const serialiseBind = (msg: Bind): Uint8Array => {
  const destPortal = msg.portal
  const stmt = msg.stmt
  const paramLength = msg.params.reduce<number>((acc, param) => {
    const byteCountLen = 4
    // TODO: handle arrays
    const bytes = param === null ? 0 : param.toString().length
    return acc + byteCountLen + bytes + 2
  }, 0)
  const len = 4 + clen(destPortal) + clen(stmt) + 2 + 2 + 2 + paramLength + 2 + 2
  let buf = new Uint8Array(1 + len)
  let pos = 0

  const paramFormat = 0 // all params in text format
  const paramCount = msg.params.length

  buf[0] = "B".charCodeAt(0)
  pos = pos + 1
  spliceInt(buf, pos, len, 4)
  pos = pos + 4
  spliceStr(buf, pos, destPortal)
  pos = pos + clen(destPortal)
  spliceStr(buf, pos, stmt)
  pos = pos + clen(stmt)
  spliceInt(buf, pos, 1, 2) // one format code
  pos = pos + 2
  spliceInt(buf, pos, paramFormat, 2)
  pos = pos + 2
  spliceInt(buf, pos, paramCount, 2)
  pos = pos + 2

  let idx = 0
  while (idx < paramCount) {
    const param = msg.params[idx]
    if (param === null) {
      spliceInt(buf, pos, -1, 4)
      pos = pos + 4
    } else {
      const paramStr = param.toString()
      const len = paramStr.length
      spliceInt(buf, pos, len, 4)
      pos = pos + 4
      spliceStr(buf, pos, paramStr, false)
      pos = pos + len
    }
    idx = idx + 1
  }

  const resFormat = 0 // all results in text format
  spliceInt(buf, pos, 1, 2) // one format code
  pos = pos + 2
  spliceInt(buf, pos, resFormat, 2)
  return buf
}

/**
 * Int8 'C'
 * Int32 Length
 * Int8 'S' or 'P'
 * CString Name
 */
const serialiseClose = (msg: Close): Uint8Array => {
  const len = 4 + 1 + clen(msg.name)
  let buf = new Uint8Array(1 + len)
  buf[0] = "C".charCodeAt(0)
  spliceInt(buf, 1, len, 4)
  spliceInt(buf, 5, msg.toClose === "statement" ? "S".charCodeAt(0) : "P".charCodeAt(0), 1)
  spliceStr(buf, 6, msg.name)
  return buf
}

/**
 * Int8 'E'
 * Int32 Length
 * CString Portal
 * Int32 Max Rows, 0 = No Limit
 */
const serialiseExecute = (msg: Execute): Uint8Array => {
  const len = 4 + clen(msg.portal) + 4
  let buf = new Uint8Array(1 + len)
  buf[0] = "E".charCodeAt(0)
  spliceInt(buf, 1, len, 4)
  spliceStr(buf, 5, msg.portal)
  spliceInt(buf, 5 + clen(msg.portal), msg.maxRows, 4)
  return buf
}

/**
 * Int8 'S'
 * Int32 Length
 */
const serialiseSync = (msg: Sync): Uint8Array => {
  let buf = new Uint8Array(5)
  buf[0] = "S".charCodeAt(0)
  spliceInt(buf, 1, 4, 4)
  return buf
}

/******************************************************************************/

const clen = (s: string): number => s.length + 1

const spliceInt = (buf: Uint8Array, idx: number, n: number, bytes: number = 4): void => {
  let i = 0
  while (i < bytes) {
    const shiftBy = (bytes - (i + 1)) * 8
    buf[idx + i] = (n >> shiftBy) % 0xff // take last byte
    i++
  }
}

const spliceStr = (
  buf: Uint8Array,
  idx: number,
  s: string,
  nullTerminated: boolean = true
): void => {
  Array.from(s).forEach((char, charIdx) => {
    buf[idx + charIdx] = char.charCodeAt(0)
    if (nullTerminated) buf[idx + s.length] = 0x00
  })
}
