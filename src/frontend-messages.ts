import { TSType } from "./pg_types"

export type Msg = StartupMessage | PasswordMessage | Query | Parse | Bind | Execute | Sync

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

type FormatCode = "text" | "binary"

export type Bind = {
  _tag: "Bind"
  portal: string
  stmt: string
  params: TSType[]
  paramFormats: FormatCode[]
  resultFormats: FormatCode[]
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
    default:
      throw Error("Unreachable (4)")
  }
}

/*
For all Frontend messages, the length does not include the initial 'type' byte,
but does include the 4 bytes of the length attribute.
*/

/**
 * Int32 Length
 * Int16 Major Protocol Version
 * Int16 Minor Protocol Version
 * CString[]: Parameter Keys and Values
 * Null Final Byte
 *
 * For simple use cases, only the user and database parameters are relevant, so
 * I’m skipping the replication mode parameter.
 */
const serialiseStartupMessage = (msg: StartupMessage): Uint8Array =>
  buildMsg(null, [
    Int16(msg.majorVersion),
    Int16(msg.minorVersion),
    CStr("user"),
    CStr(msg.user),
    CStr("database"),
    CStr(msg.database),
    Int8(0x00),
  ])

/**
 * Int8 'p'
 * Int32 Length
 * CString hashed password
 */
const serializePasswordMessage = (msg: PasswordMessage): Uint8Array =>
  buildMsg("p", [CStr(msg.password)])

/**
 * Int8 'Q'
 * Int32 Length
 * CString Simple Query
 */
const serialiseQuery = (msg: Query): Uint8Array => buildMsg("Q", [CStr(msg.query)])

/**
 * Int8 'P'
 * Int32 Length
 * CString Prepared Stmt Name
 * CString Query String
 * Int16 Number of Specified Types
 * Int32[] Type Oids
 */
const serialiseParse = (msg: Parse): Uint8Array =>
  buildMsg("P", [CStr(msg.name), CStr(msg.query), Int16(msg.types.length), ...msg.types.map(Int32)])

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
const serialiseBind = (msg: Bind): Uint8Array =>
  buildMsg("B", [
    CStr(msg.portal),
    CStr(msg.stmt),
    Int16(msg.paramFormats.length),
    ...msg.paramFormats.map((code) => (code === "text" ? Int16(0) : Int16(1))),
    Int16(msg.params.length),
    ...msg.params.flatMap((param) =>
      param === null
        ? [Int32(-1), Str("")]
        : [Int32(param.toString().length), Str(param.toString())]
    ),
    Int16(msg.resultFormats.length),
    ...msg.resultFormats.map((code) => (code === "text" ? Int16(0) : Int16(1))),
  ])

/**
 * Int8 'E'
 * Int32 Length
 * CString Portal
 * Int32 Max Rows, 0 = No Limit
 */
const serialiseExecute = (msg: Execute): Uint8Array =>
  buildMsg("E", [CStr(msg.portal), Int32(msg.maxRows)])

/**
 * Int8 'S'
 * Int32 Length
 */
const serialiseSync = (msg: Sync): Uint8Array => buildMsg("S", [])

/******************************************************************************/

type Int32 = [number, 4]
const Int32 = (n: number): Field => [n, 4]

type Int16 = [number, 2]
const Int16 = (n: number): Field => [n, 2]

type Int8 = [number, 1]
const Int8 = (n: number): Field => [n, 1]

type CStr = [string, true]
const CStr = (s: string): Field => [s, true]

type Str = [string, false]
const Str = (s: string): Field => [s, false]

type Field = Int32 | Int16 | Int8 | CStr | Str

const buildMsg = (msgType: string | null, fields: Field[]): Uint8Array => {
  const content = fields.reduce<number[]>((acc, field) => acc.concat(fieldBytes(field)), [])
  const msgLength = 4 + content.length
  const lenBytes = intBytes(msgLength, 4)
  const header = msgType ? [msgType.charCodeAt(0), ...lenBytes] : lenBytes
  return new Uint8Array(header.concat(content))
}

const fieldBytes = (field: Field): number[] => {
  if (typeof field[0] === "number" && typeof field[1] === "number") {
    return intBytes(field[0], field[1])
  } else if (typeof field[0] === "string" && typeof field[1] === "boolean") {
    return strBytes(field[0], field[1])
  } else {
    throw Error("Unreachable (3)")
  }
}

const intBytes = (n: number, bytes: number): number[] => {
  let i = 0
  let buf = new Array(bytes)
  while (i < bytes) {
    const shiftBy = (bytes - (i + 1)) * 8
    buf[i] = (n >> shiftBy) % 0xff // take last byte
    i++
  }
  return buf
}

const strBytes = (s: string, nullTerminated: boolean = true): number[] => {
  const buf = Array.from(s).map((char) => char.charCodeAt(0))
  if (nullTerminated) buf.push(0x00)
  return buf
}
