export class ParseResult {
  failed
  parsed
  unparsed

  constructor({ failed = false, parsed, unparsed }) {
    this.failed = failed
    this.parsed = parsed
    this.unparsed = unparsed
  }

  // Transform if successful
  map(f) {
    if (this.failed)
      return this

    return new ParseResult(
      f({
        parsed: this.parsed,
        unparsed: this.unparsed
      })
    )
  }

  // Transform successfully parsed value
  mapParsed(f) {
    if (this.failed)
      return this

    return new ParseResult({
      parsed: f(this.parsed),
      unparsed: this.unparsed
    })
  }

  // Transform not-yet-parsed values if parsing was successful so far
  mapUnparsed(f) {
    if (this.failed)
      return this

    return new ParseResult({
      parsed: this.parsed,
      unparsed: f(this.unparsed)
    })
  }
}

// First match of a regular expression
// (or value that can be converted to one, like a string)
export const match = (regex, value) => input => {
  const matchResult = input.match(regex)
  if (!matchResult || matchResult.index !== 0)
    return new ParseResult({
      failed: true,
      unparsed: input
    })

  const match = matchResult[0]
  return new ParseResult({
    parsed: value ?? match,
    unparsed: input.slice(match.length)
  })
}

// Apply a parser only if it succeeds
export const optional = parser => input => {
  const result = parser(input)
  return !result.failed
    ? result
    : new ParseResult({
      unparsed: input
    })
}

// Apply the first successful parser
export const either = (...parsers) => input => {
  for (const parser of parsers) {
    const result = parser(input)
    if (!result.failed)
      return result
  }

  return new ParseResult({
    failed: true,
    unparsed: input
  })
}

// Apply all of the parsers
export const all = (...parsers) => input => {
  const parsed = []
  let unparsed = input

  for (const parser of parsers) {
    const result = parser(unparsed)
    if (result.failed)
      return result

    parsed.push(result.parsed)
    unparsed = result.unparsed
  }

  return new ParseResult({
    parsed,
    unparsed
  })
}

// Apply a parser until it fails
export const many = parser => input => {
  const parsed = []
  let unparsed = input

  while (true) {
    const result = parser(unparsed)
    if (result.failed) {
      if (parsed.length)
        break

      // failed on first try
      return new ParseResult({
        failed: true,
        unparsed
      })
    }

    parsed.push(result.parsed)
    unparsed = result.unparsed
  }

  return new ParseResult({
    parsed,
    unparsed
  })
}
