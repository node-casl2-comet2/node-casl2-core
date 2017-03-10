"use strict";

import { InstructionBase } from "./instructionBase";
import { MDC } from "./mdc";
import { IN } from "./in";
import { OUT } from "./out";
import { OLBL } from "./olbl";
import { GR } from "@maxfield/node-casl2-comet2-core-common";
import { LexerResult } from "../casl2/lexerResult";
import { escapeStringConstant } from "../helpers/escapeStringConstant";
import { jisx0201 } from "@maxfield/node-casl2-comet2-core-common";
import { Expected } from "../expected";
import { Diagnostic, DiagnosticMessage } from "../diagnostics/types";
import { Diagnostics } from "../diagnostics/diagnosticMessages";
import { createDiagnostic } from "../diagnostics/diagnosticMessage";

function createError(message: DiagnosticMessage, lineNumber: number, startIndex = 0, endIndex = 0) {
    return {
        success: false,
        errors: [createDiagnostic(lineNumber, startIndex, endIndex, message)]
    };
}

export class Instructions {
    public static create(result: LexerResult, lineNumber: number): Expected<InstructionBase, Diagnostic> {
        // 引数を取らない命令(5個)
        const nopLikeInstRegex = /\b(END|RPUSH|RPOP|RET|NOP)\b/;

        // rを引数に取る命令(1個)
        const popLikeInstRegex = /\b(POP)\b/;

        // adr[, x]を引数に取る命令(9個)
        const jumpLikeInstRegex = /\b(JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|CALL|SVC)\b/;

        // 引数にr, adr[, x]を取る命令(6個)
        const ladLikeInstRegex = /\b(ST|LAD|SLA|SRA|SLL|SRL)\b/;

        // 引数にr1, r2またはr, adr[, x]を取る命令(10個)
        const addaLikeInstRegex = /\b(LD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL)\b/;

        // [adr]を引数に取る命令(1個)
        const startLikeInstRegex = /\b(START)\b/;

        const inst = result.instruction!;
        if (inst.match(nopLikeInstRegex)) {
            // 引数を取らない
            // 引数が1つもないことを確かめる
            if (result.r1 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);
            if (result.r2 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);
            if (result.address !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);

            const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label);
            return {
                success: true,
                value: instBase
            };
        }
        else if (inst.match(popLikeInstRegex)) {
            // r
            // r1のみがあることを確かめる
            if (result.r1 === undefined) return createError(Diagnostics.Missing_r, lineNumber);
            if (result.r2 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);
            if (result.address !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);

            const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label, result.r1);
            return {
                success: true,
                value: instBase
            };
        }
        else if (inst.match(jumpLikeInstRegex)) {
            // adr[, x]
            // アドレスがあること
            if (result.address === undefined) return createError(Diagnostics.Missing_address, lineNumber);
            if (result.r1 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);

            const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label, undefined, result.r2, result.address);
            return {
                success: true,
                value: instBase
            };
        }
        else if (inst.match(ladLikeInstRegex)) {
            // r, adr[, x]
            if (result.r1 === undefined) return createError(Diagnostics.Missing_r, lineNumber);
            if (result.address === undefined) return createError(Diagnostics.Missing_address, lineNumber);

            const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
            return {
                success: true,
                value: instBase
            };
        }
        else if (inst.match(addaLikeInstRegex)) {
            // r1, r2
            // r, adr[, x]
            if (result.address !== undefined) {
                // アドレス有り
                if (result.r1 === undefined) return createError(Diagnostics.Missing_GR_r1, lineNumber);

                const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label, result.r1, result.r2, result.address);
                return {
                    success: true,
                    value: instBase
                };
            } else {
                // アドレス無し
                if (result.r1 === undefined) return createError(Diagnostics.Missing_GR_r1, lineNumber);
                if (result.r2 === undefined) return createError(Diagnostics.Missing_GR_r2, lineNumber);

                // アドレス無しの方の命令コードはアドレス有りのものに4加えたものになる
                const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst)! + 4, result.label, result.r1, result.r2);
                return {
                    success: true,
                    value: instBase
                };
            }
        } else if (inst.match(startLikeInstRegex)) {
            // [adr]
            if (result.r1 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);
            if (result.r2 !== undefined) return createError(Diagnostics.Unnecessary_operand, lineNumber);

            const instBase = new InstructionBase(inst, lineNumber, Instructions.InstMap.get(inst), result.label, undefined, undefined, result.address);
            return {
                success: true,
                value: instBase
            };
        }

        switch (inst) {
            case "IN": return Instructions.createIN(result, lineNumber);
            case "OUT": return Instructions.createOUT(result, lineNumber);
        }

        throw new Error("Unknown instruction");
    }

    private static createIN(result: LexerResult, lineNumber: number): Expected<InstructionBase, Diagnostic> {
        if (result.instruction != "IN") throw new Error();
        if (result.address === undefined) return createError(Diagnostics.Missing_input_buf, lineNumber);
        if (result.lengthAddress === undefined) return createError(Diagnostics.Missing_input_length_buf, lineNumber);

        const _in = new IN(lineNumber, result.label, result.address, result.lengthAddress);

        return {
            success: true,
            value: _in
        };
    }

    private static createOUT(result: LexerResult, lineNumber: number): Expected<InstructionBase, Diagnostic> {
        if (result.instruction != "OUT") throw new Error();
        if (result.address == undefined) return createError(Diagnostics.Missing_output_buf, lineNumber);
        if (result.lengthAddress == undefined) return createError(Diagnostics.Missing_output_length_buf, lineNumber);

        const out = new OUT(lineNumber, result.label, result.address, result.lengthAddress);

        return {
            success: true,
            value: out
        };
    }


    // DS命令とDC命令だけInstructionBaseの配列を返す場合があるので別にしている

    public static createDSDC(result: LexerResult, lineNumber: number): Expected<InstructionBase | Array<InstructionBase>, Diagnostic> {
        const inst = result.instruction!;

        function f(result: LexerResult, lineNumber: number, method: (result: LexerResult, lineNumber: number) => Expected<InstructionBase | Array<InstructionBase>, Diagnostic>) {
            const r = method(result, lineNumber);
            if (r.success) {
                return {
                    success: true,
                    value: r.value
                };
            } else {
                return {
                    success: false,
                    errors: r.errors
                };
            }
        }

        if (inst === "DS") {
            return f(result, lineNumber, Instructions.createDS);
        }
        if (inst === "DC") {
            return f(result, lineNumber, Instructions.createDC);
        }

        throw new Error(`"${inst} is not DS or DC"`);
    }

    private static createDS(result: LexerResult, lineNumber: number): Expected<InstructionBase | Array<InstructionBase>, Diagnostic> {
        const { instruction, wordCount } = result;
        if (instruction != "DS") throw new Error();
        if (wordCount === undefined) return createError(Diagnostics.Missing_word_count, lineNumber);

        if (wordCount == 0) {
            // 語数が0の場合領域は確保しないがラベルは有効である
            // OLBL命令: ラベル名だけ有効でバイト長は0
            const olbl = new OLBL(lineNumber, result.label);
            return {
                success: true,
                value: olbl
            };
        } else {
            // 語数と同じ数のNOP命令に置き換える
            const nops = new Array<InstructionBase>();
            nops.push(new InstructionBase("NOP", lineNumber, Instructions.InstMap.get("NOP"), result.label));
            for (let i = 1; i < wordCount; i++) {
                nops.push(new InstructionBase("NOP", undefined, Instructions.InstMap.get("NOP")));
            }
            return {
                success: true,
                value: nops
            };
        }
    }

    private static createDC(result: LexerResult, lineNumber: number): Expected<InstructionBase | Array<InstructionBase>, Diagnostic> {
        if (result.instruction != "DC") throw new Error();
        if (result.consts === undefined) return createError(Diagnostics.Missing_constans, lineNumber);

        const errors: Array<Diagnostic> = [];

        const isStringLiteral = (c: string | number) => typeof c == "string" && c.startsWith("'");

        function validateStringConstant(strLiteral: string): string | undefined {
            // シングルクォーテーションで囲まれた部分の文字列を取り出す
            const str = strLiteral.slice(1, strLiteral.length - 1);
            // シングルクォーテーションをエスケープする
            const escaped = escapeStringConstant(str);
            if (escaped == undefined) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Cannot_escape_single_quotes));
                return;
            }

            // 文字列定数がJIS X 0201の範囲内かチェックする
            const inRange = jisx0201.isStrInRange(escaped);
            if (!inRange) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.JIS_X_0201_out_of_range));
                return;
            }

            return escaped;
        }

        function splitStringLiteralToMdcs(strLiteral: string, mdcs: Array<MDC>, label?: string): void {
            const escaped = validateStringConstant(strLiteral);
            if (escaped === undefined) return;

            const ch = escaped.charAt(0);
            const mdc = new MDC(label, undefined, ch);
            mdcs.push(mdc);
            for (let i = 1; i < escaped.length; i++) {
                const ch = escaped.charAt(i);
                const mdc = new MDC(undefined, undefined, ch);
                mdcs.push(mdc);
            }
        }

        if (result.consts.length == 1) {
            const c = result.consts[0];
            if (isStringLiteral(c)) {
                const mdcs = new Array<MDC>();
                splitStringLiteralToMdcs(c as string, mdcs, result.label);
                if (errors.length > 0) {
                    return {
                        success: false,
                        errors: errors
                    };
                } else {
                    return {
                        success: true,
                        value: mdcs
                    };
                }
            } else {
                const mdc = new MDC(result.label, c);
                return {
                    success: true,
                    value: mdc
                };
            }
        } else {
            const mdcs = new Array<MDC>();
            // DC命令のオペランドが2つ以上ならそれぞれの定数についてMDC命令に分解する
            // 例:
            // CONST DC   3, #0005 =>  CONST MDC   3
            //                               MDC   #0005
            const c = result.consts[0];
            if (isStringLiteral(c)) {
                const error = splitStringLiteralToMdcs(c as string, mdcs, result.label);
                if (error) return error;
            } else {
                const mdc = new MDC(result.label, c);
                mdcs.push(mdc);
            }

            for (let i = 1; i < result.consts.length; i++) {
                const c = result.consts[i];
                if (isStringLiteral(c)) {
                    const error = splitStringLiteralToMdcs(c as string, mdcs);
                    if (error) return error;
                } else {
                    const mdc = new MDC(undefined, c);
                    mdcs.push(mdc);
                }
            }

            return {
                success: true,
                value: mdcs
            };
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
        ["RPUSH", 0xA0],
        ["RPOP", 0xA1]
    ]);
}
