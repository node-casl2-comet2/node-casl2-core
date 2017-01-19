'use strict';

import { InstructionBase } from './instructionBase';
import { GR } from '../comet2/gr';
import { LexerResult } from '../casl2/lexer';
import { CompileError } from '../errors/compileError';
import { ArgumentError } from '../errors/argumentError';

export class Instructions {
    /**
     * START命令
     */
    public static start(label?: string) {
        return new InstructionBase("START", null, label);
    }

    /**
     * RET命令
     */
    public static ret(label?: string) {
        return new InstructionBase("RET", 0x81, label);
    }

    /**
     * END命令
     */
    public static end() {
        return new InstructionBase("END", null);
    }

    /**
     * LAD命令
     */
    public static lad(label: string, r: GR, adr: number | string, x?: GR) {
        return new InstructionBase("LAD", 0x12, label, r, x, adr);
    }

    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, r2: GR): InstructionBase;
    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, adr: number | string, x?: GR): InstructionBase;
    public static adda(label: string, x1: any, x2: any, x3?: any): InstructionBase {
        if (typeof x2 == "GR") {
            // アドレス無し
            return new InstructionBase("ADDA", 0x24, label, x1, x2).confirmed();
        } else {
            // アドレス有り
            return new InstructionBase("ADDA", 0x20, label, x1, x3, x2);
        }
    }

    public static create(result: LexerResult, lineNumber: number): InstructionBase | CompileError {
        // TODO: IN | OUT の分類を決める
        // 引数を取らない命令(5個)
        let noArgsInstRegex = /\b(END|RPUSH|RPOP|RET|NOP)\b/;

        // rを引数に取る命令(1個)
        let rInstRegex = /\b(POP)\b/;

        // adr[, x]を引数に取る命令(9個)
        let adrxInstRegex = /\b(JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|CALL|SVC)\b/;

        // 引数にr, adr[, x]を取る命令(6個)
        let radrxInstRegex = /\b(ST|LAD|SLA|SRA|SLL|SRL)\b/;

        // 引数にr1, r2またはr, adr[, x]を取る命令(10個)
        let r1r2InstRegex = /\b(LD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL)\b/;

        // [adr]を引数に取る命令(1個)
        let adrInstRegex = /\b(START)\b/;

        // 数値を引数に取る命令(1個)
        let numberArgsInstRegex = /\b(DS)\b/;

        // 定数列を引数に取る命令(1個)
        let constArgsInstRegex = /\b(DC)\b/;

        let inst = result.instruction;
        if (inst.match(noArgsInstRegex)) {
            // 引数を取らない            
            // 引数が1つもないことを確かめる
            if (result.r1 || result.r2 || result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label);
            return instBase;
        }
        else if (inst.match(rInstRegex)) {
            // r
            // r1のみがあることを確かめる
            if (!result.r1 || result.r2 || result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1);
            return instBase;
        }
        else if (inst.match(adrxInstRegex)) {
            // adr[, x]
            // アドレスがあること
            if (!result.address || result.r1) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, null, result.r2, result.address);
            return instBase;
        }
        else if (inst.match(radrxInstRegex)) {
            // r, adr[, x]
            if (!result.r1 || !result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
            return instBase;
        }
        else if (inst.match(r1r2InstRegex)) {
            // r1, r2
            // r, adr[, x]
            if (result.address) {
                // アドレス有り
                if (!result.r1) return new ArgumentError(lineNumber);
                let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
                return instBase;
            } else {
                // アドレス無し
                if (!(result.r1 && result.r2)) throw new ArgumentError(lineNumber);
                // アドレス無しの方の命令コードはアドレス有りのものに4加えたものになる
                let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst) + 4, result.label, result.r1, result.r2);
                return instBase;
            }
        } else if (inst.match(adrInstRegex)) {
            // [adr]
            if (result.r1 || result.r2) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, null, null, result.address);
            return instBase;
        } else if (inst.match(numberArgsInstRegex)) {
            throw new Error("not implemented");
        } else if (inst.match(constArgsInstRegex)) {
            throw new Error("not implemented");
        }

        throw new Error("Unknown instruction");
    }

    private static InstMap = new Map<String, number>([
        ["LD", 0x10],
        ["ST", 0x11],
        ["LAD", 0x12],
        ["ADDA", 0x20],
        ["ADDL", 0x22],
        ["SUBA", 0x21],
        ["SUBL", 0x23],
        ["AND", 0x30],
        ["OR", 0x31],
        ["XOR", 0x32],
        ["CPA", 0x40],
        ["CPL", 0x41],
        ["SLA", 0x50],
        ["SRA", 0x51],
        ["SLL", 0x52],
        ["SRL", 0x53],
        ["JPL", 0x65],
        ["JMI", 0x61],
        ["JNZ", 0x62],
        ["JZE", 0x63],
        ["JOV", 0x66],
        ["JUMP", 0x64],
        ["PUSH", 0x70],
        ["POP", 0x71],
        ["CALL", 0x80],
        ["RET", 0x81],
        ["SVC", 0xF0],
        ["NOP", 0x00],
    ]);
}
