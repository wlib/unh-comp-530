// Apply a function to every value in an object, returning a new object
export const mapObject = (o, f) =>
  Object.fromEntries(
    Object.entries(o)
      .map(([key, value]) => [key, f(value)])
  )

// Switch the keys and values in an object
export const invertObject = o =>
  Object.fromEntries(
    Object.entries(o)
      .map(([key, value]) => [value, key])
  )

// Logarithm of a number with base
export const log = (x, base = 10) =>
  Math.log(x) / Math.log(base)

// Digits per byte with base
export const digitsPerByte = base =>
  Math.ceil(log(2**8, base))

// Bytes to url-safe base64
export const bytesToBase64Url = bytes =>
  btoa(
    bytes
      .map(byte => String.fromCharCode(byte))
      .join("")
  )
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_")

// reverse above
export const base64UrlToBytes = base64url =>
  atob(
    base64url
      .replaceAll("-", "+")
      .replaceAll("_", "/")
  )
    .split("")
    .map(c => c.charCodeAt(0))
