import * as Net from "net"
import { Md5 } from "ts-md5"

const msgToBytes = (...msgs: string[]): Uint8Array => {
  // unicode...meh
  const msgLen = msgs.join("").length + msgs.length // msg length, plus a null terminator per string
  const bufLen = 8 + msgLen + 1
  const protocolMajor = 3
  const protocolMinor = 0
  let buf = new Uint8Array(bufLen)
  buf[0] = (bufLen >> 24) % 256
  buf[1] = (bufLen >> 16) % 256
  buf[2] = (bufLen >> 8) % 256
  buf[3] = bufLen % 256
  buf[4] = (protocolMajor >> 8) % 256
  buf[5] = protocolMajor % 256
  buf[6] = (protocolMinor >> 8) % 256
  buf[7] = protocolMinor % 256
  let idx = 8
  msgs.forEach((msg) => {
    Array.from(msg).forEach((char) => {
      buf[idx] = char.charCodeAt(0)
      idx++
    })
    buf[idx] = 0
    idx++
  })
  buf[bufLen - 1] = 0
  return buf
}

const mkPassBuf = (bytes: Uint8Array): Uint8Array => {
  const bufLen = 40
  let buf = new Uint8Array(1 + bufLen)
  buf[0] = "p".charCodeAt(0)
  buf[1] = 0
  buf[2] = 0
  buf[3] = 0
  buf[4] = bufLen
  buf[5] = "m".charCodeAt(0)
  buf[6] = "d".charCodeAt(0)
  buf[7] = "5".charCodeAt(0)
  let hash = new Md5()
  hash.appendAsciiStr("cervest")
  hash.appendAsciiStr("root")
  let hashed: string = hash.end() as string
  hash = new Md5
  hash.appendStr(hashed)
  hash.appendByteArray(bytes.slice(9, 13))
  hashed = hash.end() as string
  const hashedChars = Array.from(hashed)
  let idx = 8
  while (idx < bufLen) {
    buf[idx] = hashedChars[idx - 8].charCodeAt(0)
    idx++
  }
  buf[bufLen] = 0
  console.log(buf)
  return buf
}

class Conn {
  sock: Net.Socket
  constructor() {
    let client = new Net.Socket()

    client.connect(5432, "localhost", () => {
      console.log("Hey I'm connected, that's a good start")
    })

    client.on("data", function (data) {
      console.log("DATA: " + JSON.stringify(data))
      if (data[0] === 82) {
        const passBuf = mkPassBuf(data)
        client.write(passBuf, (e) => {
          if (e) console.log("Error ", e)
        })
      }
    })

    client.on("close", function () {
      console.log("Connection closed")
    })

    this.sock = client
  }

  sendMsg(...msgs: string[]): void {
    const buf = msgToBytes(...msgs)

    this.sock.write(buf, (e) => console.error(e))
  }
}

const conn = new Conn()

conn.sendMsg("user", "root", "database", "assets") // + "database" + "assets")

// returns 82, 0 0 0 12, 0 0 0 5, 247, 65, 241, 61
// AuthenticationMD5Password
// 'R' means an auth request
// 12 is the length
// 5 is md5 request
// rest is the salt

// 20e67ad0843e5c40157e0a0abdf8e0df
// let passBuf =

// https://www.postgresql.org/docs/current/protocol.html
