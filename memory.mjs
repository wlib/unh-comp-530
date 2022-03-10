import { digitsPerByte } from "./utils.mjs"
import { invertedAlphabets, stringToNumber, numberToString } from "./convert-bases.mjs"
import { base64UrlToBytes, bytesToBase64Url } from "./utils.mjs"

// Array of 0-255 integers to array of 0's and 1's
export const bytesToBits = bytes =>
  bytes.flatMap(byte =>
    numberToString(byte, 2)
      .padStart(8, "0")
      .split("")
      .map(Number)
  )

// reverse above
export const bitsToBytes = bits =>
  bits.reduce((bytes, bit) => {
    if (bytes.at(-1).length === 8)
      bytes.push([])

    bytes.at(-1).push(bit)
    return bytes
  }, [[]])
  .map(byte => stringToNumber(byte.join(""), 2))

export default class Memory {
  #memory = []

  static fromString(string, { base = 2, base64url } = {}) {
    let bytes
    if (base64url) {
      bytes = base64UrlToBytes(string)
    }
    else {
      bytes = string
        .toUpperCase()
        .split("")
        .filter(c => c in invertedAlphabets[base])
        .reduce((bytes, bit) => {
          if (bytes.at(-1).length === digitsPerByte(base))
            bytes.push([])

          bytes.at(-1).push(bit)
          return bytes
        }, [[]])
        .map(byte => stringToNumber(byte.join(""), base))
    }

    const instance = new this()
    instance.#memory = bytesToBits(bytes)
    return instance
  }

  toString({ base = 2, base64url } = {}) {
    const bytes = bitsToBytes(this.#memory)

    if (base64url)
      return bytesToBase64Url(bytes)

    return bytes
      .map(byte =>
        numberToString(byte, base)
          .padStart(digitsPerByte(base), "0")
      )
      .join("\n")
  }

  getBits(start, length) {
    start  = Math.abs(start)
    length = Math.abs(length)

    if (start + length > this.#memory.length)
      throw new Error(`Attempt to retrieve bits from outside of memory bounds`)

    return this.#memory.slice(start, start + length)
  }

  getBitsAsString(start, length) {
    return this.getBits(start, length).join("")
  }

  getBitsAsNumber(start, length) {
    return stringToNumber(this.getBits(start, length).join(""), 2)
  }

  setBits(start, bits) {
    start  = Math.abs(start)

    if (start + bits.length > this.#memory.length)
      throw new Error(`Attempt to set bits outside of memory bounds`)

    this.#memory.splice(start, bits.length, ...bits)
  }

  setBitsFromString(start, string) {
    this.setBits(start, string.split("").map(Number))
  }

  setBitsFromNumber(start, length, number) {
    this.setBitsFromString(
      start,
      numberToString(number, 2)
        .padStart(length, "0")
    )
  }
}
