"use strict";

import { TokenInfo, TokenType } from "../lexer/token";
import { Expected } from "../../expected";
import { Diagnostic, DiagnosticMessage } from "../../diagnostics/types";
import { InstructionBase } from "../../instructions/instructionBase";
import { OLBL } from "../../instructions/olbl";
import { MDC } from "../../instructions/mdc";
import { IN, OUT } from "../../instructions/inOut";
import { createDiagnostic } from "../../diagnostics/diagnosticMessage";
import { Diagnostics } from "../../diagnostics/diagnosticMessages";
import { ArgumentType, instructionsInfo, InstructionInfo, GR } from "@maxfield/node-casl2-comet2-core-common";
import { escapeStringConstant } from "../../helpers/escapeStringConstant";
import { jisx0201 } from "@maxfield/node-casl2-comet2-core-common";



const unknownToken: TokenInfo = {
    value: "",
    type: TokenType.TUNKNOWN,
    line: -1,
    startIndex: -1,
    endIndex: -1
};

class Scanner {
    private _index: number;
    constructor(private _tokens: Array<TokenInfo>) {
        this._index = 0;
    }

    scan(): TokenInfo {
        if (!this.allScan()) {
            const t = this._tokens[this._index++];
            return t;
        } else {
            return unknownToken;
        }
    }

    allScan(): boolean {
        return this._index >= this._tokens.length;
    }

    getNext() {
        if (!this.allScan()) {
            const t = this._tokens[this._index];
            return t;
        } else {
            return unknownToken;
        }
    }

    getNextNext() {
        if (this._index < this._tokens.length - 1) {
            return this._tokens[this._index + 1];
        } else {
            return unknownToken;
        }
    }
}

function createInstructionMap(info: Array<InstructionInfo>): Map<string, InstructionInfo> {
    const map = new Map<string, InstructionInfo>();

    for (const x of info) {
        const key = x.instructionName;
        if (map.has(key)) {
            const v = map.get(key)!;
            const merge = x;
            merge.argumentType += v.argumentType;
            merge.code = Math.min(x.code, v.code);

            // 入れ替え
            map.set(key, merge);
        } else {
            map.set(key, x);
        }
    }

    return map;
}

const instructionMap = createInstructionMap(instructionsInfo);

export function parseAll(tokensList: Array<Array<TokenInfo>>): Expected<Array<InstructionBase>, Diagnostic> {
    const allDiagnostics: Array<Diagnostic> = [];
    const instructions: Array<InstructionBase> = [];
    for (const tokens of tokensList) {
        parse(tokens);
    }

    return {
        success: allDiagnostics.length == 0,
        value: instructions,
        errors: allDiagnostics
    };

    function parse(tokens: Array<TokenInfo>): void {
        const scanner = new Scanner(tokens);
        const diagnostics: Array<Diagnostic> = [];
        let instruction: InstructionBase | undefined = undefined;
        const line = tokens[0].line || 0;

        let currentToken: TokenInfo = scanner.scan();

        function token() {
            return currentToken;
        }

        function nextToken() {
            return currentToken = scanner.scan();
        }

        // 先読み
        function getNextToken() {
            return scanner.getNext();
        }

        function getNextNextToken() {
            return scanner.getNextNext();
        }

        function consumeToken(t: TokenType, pushError = true): boolean {
            const token = nextToken();
            const r = token.type == t;
            if (!r && pushError) {
                diagnostics.push(createDiagnostic(line, token.startIndex, Number.MAX_VALUE, Diagnostics._0_expected, tokenToString(t)));
            }

            return r;
        }

        function consumeAdr(): boolean {
            const token = nextToken();
            const t = token.type;
            const r = isAddressToken(t);

            if (!r) {
                diagnostics.push(createDiagnostic(line, token.startIndex, Number.MAX_VALUE, Diagnostics._0_expected, "アドレス"));
            }

            return r;
        }

        function consumeConstant(): boolean {
            const token = nextToken();
            const t = token.type;
            const r = t == TokenType.TDECIMAL || t == TokenType.THEX
                || t == TokenType.TSTRING || t == TokenType.TLABEL;

            if (!r) {
                diagnostics.push(createDiagnostic(line, token.startIndex, Number.MAX_VALUE, Diagnostics._0_expected, "定数"));
            }

            return r;
        }

        function consumeCommaSpace(pushError = true): boolean {
            if (!consumeToken(TokenType.TCOMMA, pushError)) return false;

            if (getNextToken().type == TokenType.TSPACE) {
                return consumeToken(TokenType.TSPACE, pushError);
            } else {
                return true;
            }
        }

        function consumeGR(): boolean {
            return consumeToken(TokenType.TGR);
        }

        function allScan(reportError = true): boolean {
            const r = scanner.allScan()
                || getNextToken().type == TokenType.TCOMMENT
                || (getNextToken().type == TokenType.TSPACE &&
                    (getNextNextToken().type == TokenType.TCOMMENT || getNextNextToken().type == TokenType.TUNKNOWN));
            if (!r && reportError) {
                diagnostics.push(createDiagnostic(line, token().startIndex, Number.MAX_VALUE, Diagnostics.Unnecessary_operand));
            }

            return r;
        }

        if (allScan(false)) {
            // 何もしない
        }
        else if (token().type == TokenType.TSPACE) {
            createInstruction();
        }
        // 命令と同じ名前もラベルに使用できる
        else if (token().type == TokenType.TLABEL || token().type == TokenType.TINSTRUCTION) {
            const label = token().value;

            if (nextToken().type == TokenType.TSPACE) {
                createInstruction(label);
            } else {
                diagnostics.push(createDiagnostic(line, token().startIndex, Number.MAX_VALUE, Diagnostics._0_expected, tokenToString(TokenType.TSPACE)));
            }
        } else {
            diagnostics.push(createDiagnostic(line, token().startIndex, Number.MAX_VALUE, Diagnostics._0_expected,
                `${tokenToString(TokenType.TLABEL)}または${tokenToString(TokenType.TINSTRUCTION)}`));
        }

        if (instruction) {
            instructions.push(instruction);
        }

        diagnostics.forEach(x => allDiagnostics.push(x));

        function createInstruction(label?: string) {
            if (consumeToken(TokenType.TINSTRUCTION)) {
                // 命令に応じて引数を処理する
                const inst = token();
                const info = instructionMap.get(inst.value);
                if (info === undefined) throw new Error();

                if (!(info.argumentType == ArgumentType.none || info.instructionName === "START")) {
                    if (!consumeToken(TokenType.TSPACE)) return;
                }

                switch (info.argumentType) {
                    case ArgumentType.adr_adr:
                        if (consumeAdr()) {
                            const adr1 = toAddress(token());
                            if (consumeCommaSpace() && consumeAdr()) {
                                const adr2 = toAddress(token());
                                if (allScan()) {
                                    switch (info.instructionName) {
                                        case "IN":
                                            instruction = new IN(line, label, adr1, adr2);
                                            break;
                                        case "OUT":
                                            instruction = new OUT(line, label, adr1, adr2);
                                            break;
                                        default:
                                            throw new Error();
                                    }
                                }
                            }
                        }
                        break;


                    case ArgumentType.adr_r2:
                        if (consumeAdr()) {
                            const adr = toAddress(token());
                            if (allScan(false)) {
                                instruction = new InstructionBase(info.instructionName, line, info.code, undefined, undefined, undefined, adr);
                            } else {
                                if (consumeCommaSpace() && consumeGR()) {
                                    const r2 = stringToGR(token().value);
                                    if (allScan()) {
                                        instruction = new InstructionBase(info.instructionName, line, info.code, undefined, undefined,
                                            r2, adr);
                                    }
                                }
                            }
                        }
                        break;


                    case ArgumentType.none:
                        if (allScan()) {
                            instruction = new InstructionBase(info.instructionName, line, info.code, label);
                        }
                        break;


                    case ArgumentType.other:
                        switch (info.instructionName) {
                            case "START":
                                if (!allScan(false)) {
                                    if (consumeToken(TokenType.TSPACE) && consumeToken(TokenType.TLABEL) && allScan()) {
                                        const address = toAddress(token());
                                        instruction = new InstructionBase(info.instructionName, line, info.code, label, undefined, undefined, address);
                                    }
                                } else {
                                    instruction = new InstructionBase(info.instructionName, line, info.code, label);
                                }
                                break;


                            case "DS":
                                if (consumeToken(TokenType.TDECIMAL)) {
                                    const wordCount = parseInt(token().value);
                                    if (isNaN(wordCount)) throw new Error();

                                    if (wordCount == 0) {
                                        // 語数が0の場合領域は確保しないがラベルは有効である
                                        // OLBL命令: ラベル名だけ有効でバイト長は0
                                        const olbl = new OLBL(line, label);
                                        instructions.push(olbl);
                                    } else {
                                        // 語数と同じ数のNOP命令に置き換える
                                        const nopInfo = instructionsInfo.find(x => x.instructionName === "NOP");
                                        if (nopInfo === undefined) throw new Error();
                                        const nop = nopInfo.instructionName;
                                        const nopCode = nopInfo.code;

                                        instructions.push(new InstructionBase(nop, line, nopCode, label));
                                        for (let i = 1; i < wordCount; i++) {
                                            instructions.push(new InstructionBase(nop, -1, nopCode));
                                        }
                                    }
                                }
                                break;


                            case "DC":
                                if (consumeConstant()) {
                                    const mdcs: Array<MDC> = [];

                                    function validateStringConstant(stringToken: TokenInfo): string | undefined {
                                        if (stringToken.type != TokenType.TSTRING) throw new Error();
                                        const literal = stringToken.value;
                                        const { startIndex, endIndex } = stringToken;

                                        // シングルクォーテーションで囲まれた部分の文字列を取り出す
                                        const s = literal.slice(1, literal.length - 1);
                                        // シングルクォーテーションをエスケープする
                                        const escaped = escapeStringConstant(s);
                                        if (escaped == undefined) {
                                            diagnostics.push(createDiagnostic(line, startIndex, endIndex, Diagnostics.Cannot_escape_single_quotes));
                                            return;
                                        }

                                        // 文字列定数がJIS X 0201の範囲内かチェックする
                                        const inRange = jisx0201.isStrInRange(escaped);
                                        if (!inRange) {
                                            diagnostics.push(createDiagnostic(line, startIndex, endIndex, Diagnostics.JIS_X_0201_out_of_range));
                                            return;
                                        }

                                        return escaped;
                                    }

                                    function splitStringLiteralToMdcs(stringToken: TokenInfo, label?: string, line?: number): void {
                                        if (stringToken.type != TokenType.TSTRING) throw new Error();

                                        const escaped = validateStringConstant(stringToken);
                                        if (escaped === undefined) return;

                                        const ch = escaped.charAt(0);
                                        const mdc = new MDC(label, line, undefined, ch);
                                        mdcs.push(mdc);
                                        for (let i = 1; i < escaped.length; i++) {
                                            const ch = escaped.charAt(i);
                                            const mdc = new MDC(undefined, undefined, undefined, ch);
                                            mdcs.push(mdc);
                                        }
                                    }

                                    function addMDC(constant: string | number, label?: string, line?: number) {
                                        if (token().type == TokenType.TSTRING) {
                                            splitStringLiteralToMdcs(token(), label, line);
                                        } else {
                                            const mdc = new MDC(label, line, constant);
                                            mdcs.push(mdc);
                                        }
                                    }

                                    const constant = toConst(token());
                                    // 最初の命令にだけラベルと行番号を与える
                                    addMDC(constant, label, line);

                                    while (consumeCommaSpace(false)) {
                                        if (consumeConstant()) {
                                            const constant = toConst(token());
                                            // TODO: 命令を配置する
                                            addMDC(constant);
                                        } else {
                                            break;
                                        }
                                    }

                                    mdcs.forEach(x => instructions.push(x));
                                }
                                break;


                            default:
                                throw new Error();
                        }
                        break;


                    case ArgumentType.r:
                        if (consumeToken(TokenType.TGR)) {
                            if (allScan()) {
                                const r1 = stringToGR(token().value);
                                instruction = new InstructionBase(info.instructionName, line, info.code, label, r1);
                            }
                        }
                        break;


                    case ArgumentType.r1_adr_r2:
                        if (consumeToken(TokenType.TGR)) {
                            const r1 = stringToGR(token().value);
                            if (consumeCommaSpace() && consumeAdr()) {
                                const address = toAddress(token());
                                if (allScan(false)) {
                                    instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, undefined, address);
                                } else {
                                    // r1, adr, r2
                                    if (consumeCommaSpace() && consumeToken(TokenType.TGR) && allScan()) {
                                        const r2 = stringToGR(token().value);
                                        instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, r2, address);
                                    }
                                }
                            }
                        }
                        break;

                    // r1, r2 または r1, adr[, r2]
                    // r1, r2単体の命令は無い
                    case ArgumentType.r1_r2_OR_r1_adr_r2:
                        if (consumeToken(TokenType.TGR)) {
                            const r1 = stringToGR(token().value);
                            if (consumeCommaSpace()) {
                                if (isAddressToken(getNextToken().type)) {
                                    // r1, adr
                                    if (!consumeAdr()) throw new Error();
                                    const address = toAddress(token());
                                    if (allScan(false)) {
                                        instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, undefined, address);
                                    } else {
                                        // r1, adr, r2
                                        if (consumeCommaSpace() && consumeToken(TokenType.TGR) && allScan()) {
                                            const r2 = stringToGR(token().value);
                                            instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, r2, address);
                                        }
                                    }
                                } else {
                                    // r1, r2
                                    if (consumeToken(TokenType.TGR) && allScan()) {
                                        const r2 = stringToGR(token().value);
                                        instruction = new InstructionBase(info.instructionName, line, info.code + 4, label, r1, r2);
                                    }
                                }
                            }
                        }
                        break;

                    default:
                        throw new Error();
                }
            }
        }
    }
}

function tokenToString(t: TokenType) {
    const v = tokenMap.get(t);
    if (v === undefined) throw new Error();

    return v;
}

function stringToGR(s: string): GR {
    switch (s) {
        case "GR0": return GR.GR0;
        case "GR1": return GR.GR1;
        case "GR2": return GR.GR2;
        case "GR3": return GR.GR3;
        case "GR4": return GR.GR4;
        case "GR5": return GR.GR5;
        case "GR6": return GR.GR6;
        case "GR7": return GR.GR7;
        case "GR8": return GR.GR8_SP;
        default: throw new Error();
    }
}

function toAddress(token: TokenInfo): string | number {
    if (!isAddressToken(token.type)) throw new Error();

    if (token.type == TokenType.TLABEL
        || token.type == TokenType.TINSTRUCTION
        || token.type == TokenType.TDECIMALLITERAL
        || token.type == TokenType.THEXLITERAL
        || token.type == TokenType.TSTRINGLITERAL) return token.value;

    const str = token.value;

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
        throw new Error();
    } else {
        // TODO: -32768 ~ 32767の範囲にあるかチェックする
        return address;
    }
}

function toConst(token: TokenInfo): number | string {
    const { type } = token;
    if (type == TokenType.TDECIMAL) {
        const d = parseInt(token.value, 10);
        if (isNaN(d)) throw new Error();

        return d;
    }
    if (type == TokenType.THEX) {
        const hex = parseInt(token.value.slice(1), 16);
        if (isNaN(hex)) throw new Error();

        return hex;
    }
    if (type == TokenType.TSTRING || type == TokenType.TLABEL) {
        return token.value;
    }

    throw new Error();
}

function isAddressToken(t: TokenType) {
    const r = t == TokenType.TLABEL
        || t == TokenType.TINSTRUCTION
        || t == TokenType.TDECIMAL
        || t == TokenType.THEX
        || t == TokenType.TDECIMALLITERAL
        || t == TokenType.THEXLITERAL
        || t == TokenType.TSTRINGLITERAL;

    return r;
}

const tokenMap: Map<TokenType, string> = new Map([
    [TokenType.TINSTRUCTION, "命令"],
    [TokenType.TGR, "GR"],
    [TokenType.TLABEL, "ラベル"],
    [TokenType.TSPACE, "空白"],
    [TokenType.TCOMMA, ","],
    [TokenType.TDECIMALLITERAL, "10進定数リテラル"],
    [TokenType.THEXLITERAL, "16進定数リテラル"],
    [TokenType.TSTRINGLITERAL, "文字定数リテラル"],
    [TokenType.TDECIMAL, "10進定数"],
    [TokenType.THEX, "16進定数"],
    [TokenType.TSTRING, "文字定数"]
]);
