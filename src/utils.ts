import { Md5 } from "ts-md5"

export const hashMd5 = (user: string, password: string, salt: Uint8Array): string => {
  let hash = new Md5()
  hash.appendAsciiStr(password)
  hash.appendAsciiStr(user)
  let hashed: string = hash.end() as string
  hash = new Md5()
  hash.appendStr(hashed)
  hash.appendByteArray(salt)
  hashed = hash.end() as string
  return "md5" + hashed
}

export const bytesToInt = (bytes: Uint8Array): number =>
  (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
