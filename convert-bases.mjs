import { mapObject, invertObject, log } from "./utils.mjs"

// Object from base to object from number to digit (array of digits)
export const alphabets =
  mapObject(
    {
      2:  "01",
      10: "0123456789",
      16: "0123456789ABCDEF"
    },
    Array.from
  )

// Object from base to object from digit to number
export const invertedAlphabets =
  mapObject(
    alphabets,
    alphabet =>
      // JS treats the keys as strings, so parse them after the inversion
      mapObject(
        invertObject(alphabet),
        parseInt
      )
  )

// Parse a string representing a number of a given base to a JS number
export const stringToNumber = (string, base) =>
  // turn the string into an array of uppercased digits
  string.toUpperCase().split("")
    // turn that array into an array of the digits' corresponding numbers
    .map(digit => invertedAlphabets[base][digit])
    // reverse the array so that the indices become the exponents
    .reverse()
    // sum each number * base^index
    .reduce((sum, n, e) => sum + n * base ** e, 0)

// Create a string representing a number of a given base from a JS number
export const numberToString = (number, base) => {
  // the number of digits is at least 1
  // number+1 = the number of possible values in a given number of digits (places)
  // number+1 <= base^places
  const places =
    Math.max(
      1,
      Math.ceil(
        log(number+1, base)
      )
    )
  // build an array of numbers, one for each place
  const numbers = Array(places)
  // work backwards, subtracting from the number
  let sum = number
  for (let e = places-1; e >= 0; e--) {
    const n = Math.floor(sum / base ** e)
    sum -= n * base ** e
    numbers[e] = n
  }
  return numbers
    // reverse the numbers so that they are big-endian
    .reverse()
    // turn the numbers into their corresponding digits
    .map(n => alphabets[base][n])
    // make this digit array into a string
    .join("")
}

export const convertBases = (inputBase, outputBase, input) =>
  numberToString(
    stringToNumber(
      input,
      inputBase
    ),
    outputBase
  )

// Convert array of bytes into an integer
export const bytesToNumber = bytes =>
  stringToNumber(
    bytes
      .map(byte =>
        numberToString(byte, 2)
          .padStart(8, "0")
      )
      .join(""),
    2
  )
