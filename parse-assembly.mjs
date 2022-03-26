import * as parse from "./parse.mjs"

export const constants = {
  instructions: {
    memory:       Symbol("memory"),
    noOperation:  Symbol("no operation"),
    halt:         Symbol("halt"),
    jump:         Symbol("jump"),
    jumpIfZero:   Symbol("jump if zero"),
    load:         Symbol("load"),
    store:        Symbol("store"),
    add:          Symbol("add"),
    subtract:     Symbol("subtract"),
    multiply:     Symbol("multiply"),
    divide:       Symbol("divide"),
    and:          Symbol("and"),
    or:           Symbol("or"),
    not:          Symbol("not"),
    equalsZero:   Symbol("equals zero"),
    lessThanZero: Symbol("less than zero")
  },

  registers: {
    r0: Symbol("r0"),
    r1: Symbol("r1"),
    r2: Symbol("r2")
  },

  addressingModes: {
    accumulator: Symbol("accumulator"),
    immediate:   Symbol("immediate"),
    direct:      Symbol("direct")
  }
}


const whitespace =
  parse.match(/\s+/)

const comment = input =>
  parse.match(/;.+$/m)(input)
    .mapParsed(parsed => ({ comment: parsed.slice(1) }))

const ignored = input =>
  parse.many(
    parse.either(
      whitespace,
      comment
    )
  )(input)
    .mapParsed(() => undefined)

const label = input =>
  parse.all(
    parse.match("@"),
    parse.match(/\w+/)
  )(input)
    .mapParsed(([, label]) => ({
      label
    }))

const register =
  parse.either(
    parse.match(/R0/i, constants.registers.r0),
    parse.match(/R1/i, constants.registers.r1),
    parse.match(/R2/i, constants.registers.r2)
  )

const argument =
  parse.either(
    parse.match(/R0/i, {
      mode: constants.addressingModes.accumulator
    }),

    input => parse.all(
      parse.match("#"),
      parse.match(/\d+/)
    )(input)
      .mapParsed(([, value]) => ({
        mode: constants.addressingModes.immediate,
        value: parseInt(value)
      })),

    input => parse.match(/\d+/)(input)
      .mapParsed(value => ({
        mode: constants.addressingModes.direct,
        value: parseInt(value)
      })),

    label
  )

const nullaryInstruction =
  parse.either(
    parse.match(/no(-?o)?p/i, { instruction: constants.instructions.noOperation }),
    parse.match(/ha?lt/i,     { instruction: constants.instructions.halt })
  )

const unaryInstruction =
  parse.either(
    input => parse.all(
      parse.match(/mem(ory)?/i),
      ignored,
      parse.match(/\d+/)
    )(input)
      .mapParsed(([,, value]) => ({
        instruction: constants.instructions.memory,
        value: parseInt(value)
      })),

    input => parse.all(
      parse.match(/ju?mp/i),
      ignored,
      argument
    )(input)
      .mapParsed(([,, argument]) => ({
        instruction: constants.instructions.jump,
        argument
      })),

    input => parse.all(
      parse.match(/not/i),
      ignored,
      register
    )(input)
      .mapParsed(([,, register]) => ({
        instruction: constants.instructions.not,
        register
      }))
  )

const binaryInstructionCode =
  parse.either(
    input => parse.either(
      parse.match(/jmz/i),
      parse.match(/jumpIfZero/i)
    )(input)
      .mapParsed(() => constants.instructions.jumpIfZero),

    parse.match(/loa?d/i,       constants.instructions.load),
    parse.match(/sto(re?)?/i,   constants.instructions.store),
    parse.match(/add/i,         constants.instructions.add),
    parse.match(/sub(tract)?/i, constants.instructions.subtract),
    parse.match(/mul(tiply)?/i, constants.instructions.multiply),
    parse.match(/div(ide)?/i,   constants.instructions.divide),
    parse.match(/and/i,         constants.instructions.and),
    parse.match(/or/i,          constants.instructions.or),

    input => parse.either(
      parse.match(/cpz/i),
      parse.match(/equalsZero/i)
    )(input)
      .mapParsed(() => constants.instructions.equalsZero),

    input => parse.either(
      parse.match(/cpl/i),
      parse.match(/lessThanZero/i)
    )(input)
      .mapParsed(() => constants.instructions.lessThanZero),
  )

const binaryInstruction = input =>
  parse.all(
    binaryInstructionCode,
    ignored,
    register,

    parse.either(
      parse.all(
        parse.optional(ignored),
        parse.match(","),
        parse.optional(ignored)
      ),
      ignored
    ),

    argument
  )(input)
    .mapParsed(([instruction,, register,, argument]) => ({
      instruction,
      register,
      argument
    }))

const instruction = input =>
  parse.all(
    parse.optional(
      parse.many(
        parse.all(
          label,
          ignored
        )
      )
    ),
    parse.either(
      nullaryInstruction,
      unaryInstruction,
      binaryInstruction
    )
  )(input)
    .mapParsed(([labels, instruction]) => {
      if (labels)
        instruction.labels = labels.map(([{ label }]) => label)

      return instruction
    })

// Gives an array of instructions
const program = input =>
  parse.all(
    parse.optional(ignored),
    parse.optional(instruction),
    parse.optional(
      parse.many(
        parse.all(
          ignored,
          instruction
        )
      )
    ),
    parse.optional(ignored)
  )(input)
    .mapParsed(parsed =>
      parsed.flat(2).filter(value => value !== undefined)
    )

export default input => {
  const parseResult = program(input)
  if (parseResult.failed || parseResult.unparsed.length)
    throw new Error(`Failed to parse assembly starting from: ${parseResult.unparsed}`)

  const instructions = parseResult.parsed

  const labelToAddress = {}

  instructions.forEach((current, i) => {
    if (i === 0) {
      current.address = 0
    }
    else {
      const previous = instructions[i - 1]

      let previousSize
      if (
        previous.instruction === constants.instructions.noOperation ||
        previous.instruction === constants.instructions.halt ||
        previous.instruction === constants.instructions.not
      )
        previousSize = 1
      else if (
        previous.instruction === constants.instructions.memory
      )
        previousSize = 2
      else
        previousSize = 3

      current.address = previous.address + previousSize
    }

    current.labels?.forEach(label => {
      labelToAddress[label] = current.address
    })
  })

  instructions.forEach(({ argument }) => {
    if (argument?.label) {
      argument.mode = constants.addressingModes.direct
      argument.value = labelToAddress[argument.label]
    }
  })

  return instructions
}
