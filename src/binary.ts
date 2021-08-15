/**
 * Returns a signed int. If you want an unsigned int, you can use the unsigned
 * right shift operator x >>> 0. There is no unsigned left shift operator.
 * https://stackoverflow.com/questions/54030623/left-shift-results-in-negative-numbers-in-javascript
 * The Postgres protocol doesn’t use unsigned ints though, so it’s irrelevant, but interesting.
 */
export const toInt = (bytes: Uint8Array): number =>
  bytes.reduce((acc, byte, idx) => acc | (byte << ((bytes.length - 1 - idx) * 8)), 0)

// I’m assuming that everything is UTF-8
export const toStr = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder("utf-8")
  return decoder.decode(new Uint8Array(bytes))
}
