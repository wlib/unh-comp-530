import parseAssembly, { constants } from "./parse-assembly.mjs"
import Memory from "./memory.mjs"

const symbolToBinary = {
  [constants.instructions.noOperation]:  "0000",
  [constants.instructions.halt]:         "0001",
  [constants.instructions.jump]:         "0010",
  [constants.instructions.jumpIfZero]:   "0011",
  [constants.instructions.load]:         "0100",
  [constants.instructions.store]:        "0101",
  [constants.instructions.add]:          "0110",
  [constants.instructions.subtract]:     "0111",
  [constants.instructions.multiply]:     "1000",
  [constants.instructions.divide]:       "1001",
  [constants.instructions.and]:          "1010",
  [constants.instructions.or]:           "1011",
  [constants.instructions.not]:          "1100",
  [constants.instructions.equalsZero]:   "1101",
  [constants.instructions.lessThanZero]: "1110",

  [constants.registers.r0]: "00",
  [constants.registers.r1]: "01",
  [constants.registers.r2]: "10",

  [constants.addressingModes.accumulator]: "00",
  [constants.addressingModes.immediate]:   "01",
  [constants.addressingModes.direct]:      "10"
}

export const assemble = code =>
  Memory.fromString(
    parseAssembly(code)
      .map(instruction => {
        if (instruction.instruction === constants.instructions.memory)
          return instruction.value.toString(2).padStart(8, "0")

        const binaryInstruction =
          symbolToBinary[instruction.instruction]              +
          (symbolToBinary[instruction.register]       ?? "00") +
          (symbolToBinary[instruction.argument?.mode] ?? "00")

        if (!instruction.argument || instruction.argument?.mode === constants.addressingModes.accumulator)
          return binaryInstruction
        else
          return binaryInstruction + instruction.argument.value.toString(2).padStart(16, "0")
      })
      .join("")
  )

export const disassemble = memory => {
  
}
