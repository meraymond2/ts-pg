import { Md5 } from "ts-md5"

// To make it easier to search for stray debugs.
export const log = {
  info: console.log,
  error: console.error,
}

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

/**
 * Returns a signed int. If you want an unsigned int, you can use the unsigned
 * right shift operator x >>> 0. There is no unsigned left shift operator.
 * https://stackoverflow.com/questions/54030623/left-shift-results-in-negative-numbers-in-javascript
 * The Postgres protocol doesn’t use unsigned ints though, so it’s irrelevant, but interesting.
 */
export const bytesToInt = (bytes: Uint8Array): number =>
  (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
