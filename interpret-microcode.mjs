import Memory from "./memory.mjs"
import { stringToNumber, numberToString } from "./convert-bases.mjs"

export class Machine {
  programCounter = 0
  registers = {
    "00": "0000000000000000",
    "01": "0000000000000000",
    "10": "0000000000000000"
  }
  instr = "0000"
  reg   = "00"
  addr  = "00"
  memory = new Memory()

  fetch() {
    this.instr = this.memory.getBitsAsString(this.programCounter * 8 + 0, 4)
    this.reg   = this.memory.getBitsAsString(this.programCounter * 8 + 4, 2)
    this.addr  = this.memory.getBitsAsString(this.programCounter * 8 + 6, 2)
  }

  step() {
    if (this.instr === "1111")
      throw new Error(`${this.instr} @ ${this.programCounter} is a non-existent instruction code`)
    if (this.reg === "11")
      throw new Error(`${this.reg} @ ${this.programCounter} is a non-existent register`)
    if (this.addr === "11")
      throw new Error(`${this.addr} @ ${this.programCounter} is a non-existent addressing mode`)

    let value
    // R0, use accumulator
    if (this.addr === "00") {
      value = this.registers["00"]
      this.programCounter++
    }
    // Immediate, use next 2 bytes
    else if (this.addr === "01") {
      value = this.memory.getBitsAsString(this.programCounter*8 + 8, 2*8)
      this.programCounter += 3
    }
    // Direct, use following number as address
    else if (this.addr === "10") {
      const address = this.memory.getBitsAsNumber(this.programCounter*8 + 8, 16)
      value = this.memory.getBitsAsString(address*8, 16)
      this.programCounter += 3
    }

    switch(this.instr) {
      // NOP - No OPeration
      case "0000": break

      // HLT - HaLT execution
      case "0001": throw `HLT: Halted execution`

      // JMP - JuMP to address
      case "0010":
        this.programCounter = stringToNumber(value, 2)
        break

      // JMZ - JuMp if register is Zero
      case "0011":
        if (stringToNumber(this.registers[this.reg], 2) === 0)
          this.programCounter = stringToNumber(value, 2)
        break

      // LOD - LOaD into register
      case "0100":
        this.registers[this.reg] = value
        break

      // STO - STOre register
      case "0101":
        if (this.addr === "00")
          this.registers["00"] = this.registers[this.reg]
        else if (this.addr === "01")
          throw new Error(`${rawInstruction} @ ${this.programCounter} uses invalid immediate addressing mode`)
        else if (this.addr === "10") {
          const address = this.memory.getBitsAsNumber(this.programCounter*8 + 8, 16)
          this.memory.setBitsFromString(address * 8, this.registers[this.reg])
        }
        break

      // ADD - ADD integers
      case "0110":
        this.registers[this.reg] =
          numberToString(
            (
              stringToNumber(this.registers[this.reg], 2) +
              stringToNumber(value, 2)
            ),
            2
          ).slice(-16).padStart(16, "0")
        break

      // SUB - SUBtract integers
      case "0111":
        this.registers[this.reg] =
          numberToString(
            (
              stringToNumber(this.registers[this.reg], 2) -
              stringToNumber(value, 2)
            ),
            2
          ).slice(-16).padStart(16, "0")
        break

      // MUL - MULtiply integers
      case "1000":
        this.registers[this.reg] =
          numberToString(
            (
              stringToNumber(this.registers[this.reg], 2) *
              stringToNumber(value, 2)
            ),
            2
          ).slice(-16).padStart(16, "0")
        break

      // DIV - DIVide integers
      case "1001":
        this.registers[this.reg] =
          numberToString(
            Math.floor(
              stringToNumber(this.registers[this.reg], 2) /
              stringToNumber(value, 2)
            ),
            2
          ).slice(-16).padStart(16, "0")
        break

      // AND - logical AND (two bits)
      case "1010":
        this.registers[this.reg] =
          numberToString(
            (
              1 === stringToNumber(this.registers[this.reg], 2) &&
              1 === stringToNumber(value, 2)
            )
              ? 1
              : 0,
            2
          ).slice(-16).padStart(16, "0")
        break

      // OR - logical OR (two bits)
      case "1011":
        this.registers[this.reg] =
          numberToString(
            (
              1 === stringToNumber(this.registers[this.reg], 2) ||
              1 === stringToNumber(value, 2)
            )
              ? 1
              : 0,
            2
          ).slice(-16).padStart(16, "0")
        break

      // NOT - logical NOT (one bit)
      case "1100":
        this.registers[this.reg] =
          numberToString(
            1 === stringToNumber(this.registers[this.reg], 2)
              ? 0
              : 1,
            2
          ).slice(-16).padStart(16, "0")
        break

      // CPZ - ComPare integer equality to Zero
      case "1101":
        this.registers[this.reg] =
          numberToString(
            0 === stringToNumber(value, 2)
              ? 1
              : 0,
            2
          ).slice(-16).padStart(16, "0")
        break

      // CPL - ComPare integer Less than zero
      case "1110":
        this.registers[this.reg] =
          numberToString(
            "1" === value[0]
              ? 1
              : 0,
            2
          ).slice(-16).padStart(16, "0")
    }

    this.fetch()
  }
}
