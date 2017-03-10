"use strict";

import { GR } from "@maxfield/node-casl2-comet2-core-common";
import { LexerResult } from "./lexerResult";
import { LexerOption } from "./lexerOption";
import { Diagnostic } from "../diagnostics/types";
import { Diagnostics } from "../diagnostics/diagnosticMessages";
import { createDiagnostic } from "../diagnostics/diagnosticMessage";
import { Expected } from "../expected";
import { splitToTokens } from "./lexer/tokenizer";

export class Lexer {
    private _lexerOption?: LexerOption;
    private static _instance: Lexer = new Lexer();

    constructor(lexerOption?: LexerOption) {
        this._lexerOption = lexerOption;
    }

    public static tokenize(line: string, lineNumber: number): Expected<LexerResult, Diagnostic> {
        return Lexer._instance.tokenize(line, lineNumber);
    }

    public tokenize(line: string, lineNumber: number): Expected<LexerResult, Diagnostic> {
        let label: string | undefined;
        let instruction: string | undefined;
        let r1: GR | undefined;
        let r2: GR | undefined;
        let address: number | string | undefined;
        let comment: string | undefined;
        let wordCount: number | undefined;
        let consts: Array<number | string> | undefined;
        let lengthAddress: number | string | undefined;
        const errors: Array<Diagnostic> = [];

        let lineCommentEliminated = line;
        const semicolonIndex = line.indexOf(";");
        if (semicolonIndex >= 0) {

            comment = line.slice(semicolonIndex);
            lineCommentEliminated = line.substring(0, semicolonIndex);
            if (lineCommentEliminated.match(/^\s*$/)) {
                // コメント行の場合
                return {
                    success: true,
                    value: new LexerResult(undefined, undefined, undefined, undefined, undefined, comment)
                };
            }
        }

        const result = splitToTokens(lineCommentEliminated, lineNumber);
        if (!result.success) {
            return {
                success: false,
                errors: result.errors
            };
        }

        const split = result.value!;
        let index = 0;
        const first = split[index];
        const second = split.length > index + 1 ? split[index + 1] : undefined;
        if (this.isInstruction(first)
            &&
            ((lineCommentEliminated.startsWith(" ")) || // 行が空白で始まる場合は一つ目のトークンが命令であると決まる
                (second === undefined || !this.isInstruction(second!)))) {
            // 1つ目のトークンが命令の場合
            instruction = first;
            index++;
        } else {
            // 1つ目のトークンがラベルの場合
            // 正常なラベルか?
            if (!isLabel(first)) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_label_0_, first));
            }

            // ラベル名にGR0-GR7は使えない
            if (this.isGR(first)) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics._0_cannot_be_used_for_label_name, first));
            }

            label = first;

            index++;
            if (index > split.length - 1) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Missing_instruction));
            } else {
                const inst = split[index];
                if (!this.isInstruction(inst)) {
                    errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_instruction_0_, inst));
                }

                instruction = inst;

                index++;
            }
        }

        // 引数のパターンは5種類
        // 0. なし
        // 1. GR
        // 2. GR, GR
        // 3. GR, アドレス, GR
        // 4. アドレス, GR
        // 5. 語数(10進定数)   (DSのみ)
        // 6. 定数[, 定数] ... (DCのみ)

        // 引数の数を求める
        const argCount = split.length - index;

        if (instruction == "DC") {
            // DC命令のオペランドの数は1以上である
            if (argCount == 0) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Missing_arguments));
            }

            for (let i = 0; i < argCount; i++) {
                const arg = split[index + i];
                // 定数か?
                const c = toConst(arg);
                if (c == undefined) {
                    errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Missing_arguments));
                } else {
                    if (consts == undefined) {
                        consts = new Array();
                    }
                    consts.push(c);
                }
            }
        }
        else if (instruction == "IN") {
            // IN    入力領域, 入力文字長領域

            // IN命令の引数の数は2である
            if (argCount != 2) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Instruction_0_arguments_count_should_be_1_, instruction, 2));
            } else {
                const inAddress = toAddress(split[index]);
                if (inAddress === undefined) {
                    errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_address_0_, inAddress));
                }
                const inLengthAddress = toAddress(split[index + 1]);

                address = inAddress;
                lengthAddress = inLengthAddress;
            }
        }
        else if (instruction == "OUT") {
            // OUT   出力領域, 出力文字長さ領域

            // OUT命令の引数の数は2である
            if (argCount != 2) {
                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Instruction_0_arguments_count_should_be_1_, instruction, 2));
            } else {
                const outAddress = toAddress(split[index]);
                const outLengthAdr = toAddress(split[index + 1]);

                address = outAddress;
                lengthAddress = outLengthAdr;
            }
        }
        else {
            if (argCount > 0) {
                // 命令の後の1つ目のトークンはレジスタまたはアドレス
                const arg1 = split[index++];
                if (this.isGR(arg1)) {
                    r1 = this.toGR(arg1);

                    if (argCount > 1) {
                        const arg2 = split[index++];
                        // GRまたはアドレス
                        if (this.isGR(arg2)) {
                            // 2. GR, GRのパターン
                            r2 = this.toGR(arg2);
                        } else {
                            // 3. GR, アドレス, GRのパターン
                            const adr = toAddress(arg2);
                            if (adr === undefined) {
                                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_address_0_, arg2));
                            } else {
                                address = adr;
                            }

                            // arg3は存在しないかもしれない
                            if (argCount == 3) {
                                const arg3 = split[index];
                                if (!this.isGR(arg3)) {
                                    errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_GR_0_, arg3));
                                } else {
                                    r2 = this.toGR(arg3);
                                }
                            }
                        }
                    }
                } else {
                    // 4. アドレス， GRのパターン
                    const adr = toAddress(arg1);
                    if (adr == undefined) {
                        errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_address_0_, arg1));
                    } else {
                        address = adr;
                    }

                    if (argCount == 1) {
                        if (instruction == "DS") {
                            // 5. 語数(10進定数)パターン
                            if (typeof adr != "number" || arg1.startsWith("#")) {
                                errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Word_count_should_be_given_by_decimal));
                            } else {
                                wordCount = adr;
                            }
                        }
                    }
                    else {
                        const arg2 = split[index];
                        if (!this.isGR(arg2)) {
                            errors.push(createDiagnostic(lineNumber, 0, 0, Diagnostics.Invalid_GR_0_, arg2));
                        } else {
                            r2 = this.toGR(arg2);
                        }
                    }
                }
            }
        }

        return {
            success: errors.length == 0,
            value: new LexerResult(label, instruction, r1, r2, address, comment, wordCount, consts, lengthAddress),
            errors: errors
        };
    }

    private isInstruction(str: string): boolean {
        const regex = /\b(START|END|DS|DC|IN|OUT|RPUSH|RPOP|LD|ST|LAD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL|SLA|SRA|SLL|SRL|JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|POP|CALL|RET|SVC|NOP)\b/;
        const result = str.match(regex) || undefined;
        return result !== undefined;
    }

    private isGR(str: string): boolean {
        let regex = /.*/;
        if (this._lexerOption && this._lexerOption.useGR8) {
            regex = /\b(GR0|GR1|GR2|GR3|GR4|GR5|GR6|GR7|GR8)\b/;
        } else {
            regex = /\b(GR0|GR1|GR2|GR3|GR4|GR5|GR6|GR7)\b/;
        }

        const result = str.match(regex) || undefined;
        return result !== undefined;
    }

    private toGR = (gr: string) => {
        if (gr == "GR0") return GR.GR0;
        if (gr == "GR1") return GR.GR1;
        if (gr == "GR2") return GR.GR2;
        if (gr == "GR3") return GR.GR3;
        if (gr == "GR4") return GR.GR4;
        if (gr == "GR5") return GR.GR5;
        if (gr == "GR6") return GR.GR6;
        if (gr == "GR7") return GR.GR7;
        if (this._lexerOption && this._lexerOption.useGR8) {
            if (gr == "GR8") return GR.GR8_SP;
        }

        throw new Error("Unknown GR");
    };
}

function isLabel(str: string): boolean {
    // 1文字目が大文字で2文字目以降は大文字または数字である
    const regex = /\b[A-Z][A-Z0-9]*\b/;
    const result = str.match(regex) || undefined;
    return result !== undefined && str.length <= 8;
}

function toConst(str: string): number | string | undefined {
    // 10進定数か?
    const decimal = parseInt(str, 10);
    if (decimal) return decimal;

    // 16進定数か?
    if (str.charAt(0) == "#") {
        const hex = parseInt(str.slice(1), 16);
        if (hex) return hex;
    }

    // 文字列か?
    if (str.length > 2 &&
        str.charAt(0) == "'" && str.charAt(str.length - 1) == "'") return str;

    // ラベルか?
    if (isLabel(str)) return str;

    return undefined;
}

function isDecimal(str: string): boolean {
    const decimal = parseInt(str, 10);
    return !isNaN(decimal);
}

function isHex(str: string): boolean {
    if (str.charAt(0) !== "#") return false;

    const hex = parseInt(str.slice(1), 16);
    return !isNaN(hex);
}

function isString(str: string): boolean {
    return str.length > 2 &&
        str.charAt(0) == "'" && str.charAt(str.length - 1) == "'";
}

function toAddress(str: string): string | number | undefined {
    // アドレスはラベル名で指定されるかも
    if (isLabel(str)) return str;

    // アドレスはリテラルかも
    // 1文字目が'='である
    if (str.charAt(0) == "=") {
        const rest = str.slice(1);
        if (!(isDecimal(rest) || isHex(rest) || isString(rest))) return undefined;

        return str;
    }

    // アドレスは16進数かも
    // 16進定数は#で始まる数字の連続である
    if (str.charAt(0) == "#") {
        const address = parseInt(str.slice(1), 16);
        if (isNaN(address)) return address;
    }

    // アドレスは10進数かも
    // 10進数と解釈して変換する
    // 変換に失敗するとNaNが返る
    const address = parseInt(str, 10);
    if (isNaN(address)) {
        return undefined;
    } else {
        // TODO: -32768 ~ 32767の範囲にあるかチェックする
        return address;
    }
}