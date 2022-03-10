export const not = n =>
  [1, 0]
[n]

export const and = (a, b) => [
  [0, 0],
  [0, 1]
]
[a]
[b]

export const or = (a, b) => [
  [0, 1],
  [1, 1]
]
[a]
[b]

export const nand = (a, b) =>
  not(
    and(a, b)
  )

export const nor  = (a, b) =>
  not(
    or(a, b)
  )

export const xor  = (a, b) =>
  and(
      or(a, b),
    nand(a, b)
  )

export const xnor = (a, b) =>
  or(
    and(a, b),
    nor(a, b)
  )

export const halfAdder = (a, b) => [
  xor(a, b),
  and(a, b)
]

export const fullAdder = (a, b, c = 0) => {
  const [s1, c1] = halfAdder(a, b)
  const [s2, c2] = halfAdder(s1, c)
  return [
    s2,
    or(c1, c2)
  ]
}

// little-endian, returns with length of max(a, b) + 1
export const rippleCarryAdder = (a, b) => {
  const length = Math.max(a.length, b.length)
  const sum = [0]
  for (let i = 0; i < length; i++)
    [sum[i], sum[i+1]] = fullAdder(
      a[i] ?? 0,
      b[i] ?? 0,
      sum[i]
    )
  return sum
}

export const onesComplement = bits =>
  bits.map(bit => bit == 1 ? 0 : 1)

export const twosComplement = bits =>
  rippleCarryAdder(
    onesComplement(bits),
    [1]
  ).slice(0, bits.length)

export const multiplyBitStrings = (a, b, length = Math.max(a.length, b.length)) => {
  const an = stringToNumber(a, 2)
  let c = "0"
  for (let i = 0; i < an; i++)
    c = addBitStrings(c, b)

  return c.slice(c.length - length)
}

export const divideBitStrings = (a, b, length = Math.max(a.length, b.length)) => {
  const an = stringToNumber(a, 2)
  const bn = stringToNumber(b, 2)
  const cn = Math.floor(an / bn)
  const c = numberToString(cn)
  return c.slice(c.length - length)
}
