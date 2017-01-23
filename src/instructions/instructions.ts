'use strict';

import { InstructionBase } from './instructionBase';
import { MDC } from './mdc';
import { GR } from '../comet2/gr';
import { LexerResult } from '../casl2/lexer';
import { CompileError } from '../errors/compileError';
import { ArgumentError } from '../errors/argumentError';

export class Instructions {
    public static create(result: LexerResult, lineNumber: number): InstructionBase | CompileError {
        // TODO: IN | OUT の分類を決める

        // 引数を取らない命令(5個)
        let nopLikeInstRegex = /\b(END|RPUSH|RPOP|RET|NOP)\b/;

        // rを引数に取る命令(1個)
        let popLikeInstRegex = /\b(POP)\b/;

        // adr[, x]を引数に取る命令(9個)
        let jumpLikeInstRegex = /\b(JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|CALL|SVC)\b/;

        // 引数にr, adr[, x]を取る命令(6個)
        let ladLikeInstRegex = /\b(ST|LAD|SLA|SRA|SLL|SRL)\b/;

        // 引数にr1, r2またはr, adr[, x]を取る命令(10個)
        let addaLikeInstRegex = /\b(LD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL)\b/;

        // [adr]を引数に取る命令(1個)
        let startLikeInstRegex = /\b(START)\b/;

        let inst = result.instruction!;
        if (inst.match(nopLikeInstRegex)) {
            // 引数を取らない            
            // 引数が1つもないことを確かめる
            if (result.r1 || result.r2 || result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label);
            return instBase;
        }
        else if (inst.match(popLikeInstRegex)) {
            // r
            // r1のみがあることを確かめる
            if (!result.r1 || result.r2 || result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1);
            return instBase;
        }
        else if (inst.match(jumpLikeInstRegex)) {
            // adr[, x]
            // アドレスがあること
            if (!result.address || result.r1) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, undefined, result.r2, result.address);
            return instBase;
        }
        else if (inst.match(ladLikeInstRegex)) {
            // r, adr[, x]
            if (!result.r1 || !result.address) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
            return instBase;
        }
        else if (inst.match(addaLikeInstRegex)) {
            // r1, r2
            // r, adr[, x]
            if (result.address) {
                // アドレス有り
                if (result.r1 == undefined) return new ArgumentError(lineNumber);
                let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
                return instBase;
            } else {
                // アドレス無し
                if (!(result.r1 && result.r2)) throw new ArgumentError(lineNumber);
                // アドレス無しの方の命令コードはアドレス有りのものに4加えたものになる
                let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst) + 4, result.label, result.r1, result.r2);
                return instBase;
            }
        } else if (inst.match(startLikeInstRegex)) {
            // [adr]
            if (result.r1 || result.r2) return new ArgumentError(lineNumber);

            let instBase = new InstructionBase(inst, Instructions.InstMap.get(inst), result.label, undefined, undefined, result.address);
            return instBase;
        } 

        throw new Error("Unknown instruction");
    }

    public static createDS(result: LexerResult, lineNumber: number): InstructionBase | Array<InstructionBase> {
        if (result.instruction != 'DS') throw new Error();

        let wordCount = result.wordCount;
        if (wordCount == 0) {
            // 語数が0の場合領域は確保しないがラベルは有効である
            // OLBL命令: ラベル名だけ有効でバイト長は0
            // TODO: OLBLは勝手に追加した命令なので別クラスにしたほうがいいかも
            let instBase = new InstructionBase('OLBL', undefined, result.label);
            return instBase;
        } else {
            // 語数と同じ数のNOP命令に置き換える
            let nops = new Array<InstructionBase>();
            nops.push(new InstructionBase('NOP', Instructions.InstMap.get('NOP'), result.label));
            for (var i = 1; i < wordCount; i++) {
                nops.push(new InstructionBase('NOP', Instructions.InstMap.get('NOP')));
            }
            return nops;
        }
    }

    public static createDC(result: LexerResult, lineNumber: number): InstructionBase | Array<InstructionBase> {
        if (result.instruction != 'DC') throw new Error();

        if (result.consts == undefined) throw new Error();

        let isStringLiteral = (c: string | number) => typeof c == 'string' && c.startsWith('\'');
        let splitStringLiteralToMdcs = (strLiteral: string, mdcs: Array<MDC>, label?: string) => {
            // シングルクォーテーションで囲まれた部分の文字列を取り出す
            let str = strLiteral.slice(1, strLiteral.length - 1);
            let ch = strLiteral.charAt(1);
            let mdc = new MDC(label, undefined, ch);
            mdcs.push(mdc);
            for (var i = 1; i < str.length; i++) {
                let ch = strLiteral.charAt(i + 1);
                let mdc = new MDC(undefined, undefined, ch);
                mdcs.push(mdc);
            }
        }

        if (result.consts.length == 1) {
            let c = result.consts[0];
            if (isStringLiteral(c)) {
                let mdcs = new Array<MDC>();
                splitStringLiteralToMdcs(c as string, mdcs, result.label);
                return mdcs;
            } else {
                let mdc = new MDC(result.label, c);
                return mdc;
            }
        } else {
            let mdcs = new Array<MDC>();
            // DC命令のオペランドが2つ以上ならそれぞれの定数についてMDC命令に分解する
            // 例:
            // CONST DC   3, #0005 =>  CONST MDC   3
            //                               MDC   #0005
            let c = result.consts[0];
            if (isStringLiteral(c)) {
                splitStringLiteralToMdcs(c as string, mdcs, result.label);
            } else {
                let mdc = new MDC(result.label, c);
                mdcs.push(mdc);
            }

            for (var i = 1; i < result.consts.length; i++) {
                let c = result.consts[i];
                if (isStringLiteral(c)) {
                    splitStringLiteralToMdcs(c as string, mdcs);
                } else {
                    let mdc = new MDC(undefined, c);
                    mdcs.push(mdc);
                }
            }

            return mdcs;
        }
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
