import { AuthenticationMD5Password, BMessage } from "./messages"

const R = 0x52

export const deserialise = (bytes: Uint8Array): BMessage => {
  console.log(bytes)
  const msgType = bytes[0]
  switch (msgType) {
    case R:
      const authMsgType = bytes[8]
      switch (authMsgType) {
        case 5:
          return deserialiseAuthenticationMD5Password(bytes)
        default:
          throw Error("Unimplemented auth request " + authMsgType)
      }
    default:
      throw Error("Unimplemented message type " + String.fromCharCode(msgType))
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
  return AuthenticationMD5Password(salt)
}
