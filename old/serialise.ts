// const cStr = (s: string): Uint8Array

import { FMessage, PasswordMessage, StartupMessage } from "./messages"

export const serialise = (msg: FMessage): Uint8Array => {
  switch (msg._tag) {
    case "PasswordMessage":
      return serializePasswordMessage(msg)
    case "StartupMessage":
      return serialiseStartupMessage(msg)
  }
}

/**
 * Int8 'p'
 * Int32 Length
 * CString
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
 * Int32 Length
 * Int16 Major Protocol Version
 * Int16 Minor Protocol Version
 * CStrings: user <user> password <password>
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

const clen = (s: string): number => s.length + 1

const spliceInt = (buf: Uint8Array, idx: number, n: number, bytes: number = 4): void => {
  let i = 0
  while (i < bytes) {
    const shiftBy = (bytes - (i + 1)) * 8
    buf[idx + i] = (n >> shiftBy) % 0xff // take last byte
    i++
  }
}

const spliceStr = (buf: Uint8Array, idx: number, s: string): void => {
  Array.from(s).forEach((char, charIdx) => {
    buf[idx + charIdx] = char.charCodeAt(0)
    buf[idx + s.length] = 0x00
  })
}
