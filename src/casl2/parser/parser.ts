"use strict";

import { TokenInfo, TokenType, isAddressToken, isConstantToken } from "../lexer/token";
import { Expected } from "../../expected";
import { Diagnostic, DiagnosticMessage } from "../../diagnostics/types";
import { InstructionBase, OriginalTokens } from "../../instructions/instructionBase";
import { OLBL } from "../../instructions/olbl";
import { MDC } from "../../instructions/mdc";
import { IN, OUT } from "../../instructions/inOut";
import { createDiagnostic } from "../../diagnostics/diagnosticMessage";
import { Diagnostics } from "../../diagnostics/diagnosticMessages";
import { ArgumentType, instructionsInfo, InstructionInfo, GR } from "@maxfield/node-casl2-comet2-core-common";
import { escapeStringConstant } from "../../helpers/escapeStringConstant";
import { jisx0201 } from "@maxfield/node-casl2-comet2-core-common";
import { instructionMap } from "../../instructions/instructionMap";
import { stringToGR } from "@maxfield/node-casl2-comet2-core-common";
import { LineTokensInfo } from "../../casl2";
import { DS } from "../../instructions/ds";



const unknownToken: TokenInfo = {
    value: "",
    type: TokenType.TENDOFLINE,
    line: 0,
    startIndex: 0,
    endIndex: 0
};

class Scanner {
    private _index: number;
    constructor(private _tokens: TokenInfo[]) {
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

    get(offset: number) {
        if (this._index < this._tokens.length - (offset - 1)) {
            return this._tokens[this._index + (offset - 1)];
        } else {
            return unknownToken;
        }
    }
}

export function parseAll(tokensMap: Map<number, LineTokensInfo>): Expected<InstructionBase[], Diagnostic> {
    const allDiagnostics: Diagnostic[] = [];
    const instructions: InstructionBase[] = [];
    tokensMap.forEach((info, key) => {
        if (info.success) {
            parse(info.tokens, key);
        }
    });

    return {
        success: allDiagnostics.length == 0,
        value: instructions,
        errors: allDiagnostics
    };

    function isEmptyOrCommentLine(tokens: TokenInfo[]): boolean {
        if (tokens.length == 0) return true;
        if (tokens.length == 1) {
            const [t0] = tokens;
            if (t0.type == TokenType.TSPACE) return true;
            if (t0.type == TokenType.TCOMMENT) return true;
        }
        if (tokens.length == 2) {
            const [t0, t1] = tokens;
            if (t0.type == TokenType.TSPACE && t1.type == TokenType.TCOMMENT) return true;
        }

        return false;
    }

    function parse(tokens: TokenInfo[], line: number): void {
        // 空行やコメント行はスキップする
        if (isEmptyOrCommentLine(tokens)) return;

        const scanner = new Scanner(tokens);
        const diagnostics: Diagnostic[] = [];
        let instruction: InstructionBase | undefined = undefined;

        let currentToken: TokenInfo = scanner.scan();

        function token() {
            return currentToken;
        }

        function nextToken() {
            return currentToken = scanner.scan();
        }

        // 先読み
        function getNextToken() {
            return scanner.get(1);
        }

        function getNextNextToken() {
            return scanner.get(2);
        }

        function consume(t: TokenType, validateFunc: (t: TokenType) => boolean, reportError = true): boolean {
            if (getNextToken().type == TokenType.TENDOFLINE) {
                if (reportError) {
                    diagnostics.push(createDiagnostic(line, token().endIndex, Number.MAX_VALUE, Diagnostics._0_expected, tokenToString(t)));
                }
                return false;
            } else {
                const token = nextToken();
                const r = validateFunc(token.type);
                if (!r && reportError) {
                    diagnostics.push(createDiagnostic(line, token.startIndex, Number.MAX_VALUE, Diagnostics._0_expected, tokenToString(t)));
                }

                return r;
            }
        }

        function consumeToken(type: TokenType, reportError = true): boolean {
            return consume(type, t => t == type, reportError);
        }

        function consumeAdr(): boolean {
            return consume(TokenType.TADDRESS, isAddressToken);
        }

        function consumeConstant(): boolean {
            return consume(TokenType.TCONSTANT, isConstantToken);
        }

        function consumeGR(): boolean {
            return consumeToken(TokenType.TGR);
        }

        function allScan(reportError = true): boolean {
            const r = scanner.allScan()
                || getNextToken().type == TokenType.TCOMMENT
                || (getNextToken().type == TokenType.TSPACE &&
                    (getNextNextToken().type == TokenType.TCOMMENT || getNextNextToken().type == TokenType.TENDOFLINE));
            if (!r && reportError) {
                diagnostics.push(createDiagnostic(line, token().startIndex, Number.MAX_VALUE, Diagnostics.Unnecessary_operand));
            }

            return r;
        }

        if (token().type == TokenType.TSPACE) {
            createInstruction();
        }
        // 命令と同じ名前もラベルに使用できる
        else if (token().type == TokenType.TLABEL || token().type == TokenType.TINSTRUCTION) {
            const label = token();

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

        function createInstruction(labelToken?: TokenInfo) {
            const label = labelToken ? labelToken.value : undefined;
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
                            const adr1Token = token();
                            const adr1 = toAddress(adr1Token);
                            if (consumeToken(TokenType.TCOMMASPACE) && consumeAdr()) {
                                const adr2Token = token();
                                const adr2 = toAddress(adr2Token);
                                if (allScan()) {
                                    const originalTokens: OriginalTokens = {
                                        instruction: inst,
                                        label: labelToken,
                                        buf: adr1Token,
                                        length: adr2Token
                                    };
                                    switch (info.instructionName) {
                                        case "IN":
                                            instruction = new IN(line, label, adr1, adr2).setOriginalTokens(originalTokens);
                                            break;
                                        case "OUT":
                                            instruction = new OUT(line, label, adr1, adr2).setOriginalTokens(originalTokens);
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
                            const addressToken = token();
                            const adr = toAddress(addressToken);
                            if (allScan(false)) {
                                instruction = new InstructionBase(info.instructionName, line, info.code, label, undefined, undefined, adr)
                                    .setOriginalTokens({
                                        instruction: inst,
                                        label: labelToken,
                                        address: addressToken
                                    });
                            } else {
                                if (consumeToken(TokenType.TCOMMASPACE) && consumeGR()) {
                                    const r2Token = token();
                                    const r2 = stringToGR(r2Token.value);
                                    if (allScan()) {
                                        instruction = new InstructionBase(info.instructionName, line, info.code, label, undefined,
                                            r2, adr).setOriginalTokens({
                                                instruction: inst,
                                                label: labelToken,
                                                address: addressToken,
                                                r2: r2Token
                                            });
                                    }
                                }
                            }
                        }
                        break;


                    case ArgumentType.none:
                        if (allScan()) {
                            instruction = new InstructionBase(info.instructionName, line, info.code, label)
                                .setOriginalTokens({
                                    instruction: inst
                                });
                        }
                        break;


                    case ArgumentType.label_START:
                        if (!allScan(false)) {
                            if (consumeToken(TokenType.TSPACE) && consumeToken(TokenType.TLABEL) && allScan()) {
                                const addressToken = token();
                                const address = toAddress(addressToken);
                                instruction = new InstructionBase(info.instructionName, line, info.code, label, undefined, undefined, address)
                                    .setOriginalTokens({
                                        instruction: inst,
                                        label: labelToken,
                                        address: addressToken
                                    });
                            }
                        } else {
                            instruction = new InstructionBase(info.instructionName, line, info.code, label)
                                .setOriginalTokens({
                                    instruction: inst,
                                    label: labelToken
                                });
                        }
                        break;


                    case ArgumentType.decimal_DS:
                        if (consumeToken(TokenType.TDECIMAL)) {
                            const wordCount = parseInt(token().value);
                            if (isNaN(wordCount)) throw new Error();

                            if (wordCount == 0) {
                                // 語数が0の場合領域は確保しないがラベルは有効である
                                // OLBL命令: ラベル名だけ有効でバイト長は0
                                const olbl = new OLBL(line, label)
                                    .setOriginalTokens({
                                        label: labelToken,
                                        instruction: inst
                                    });
                                instructions.push(olbl);
                            } else {
                                // 語数と同じ数のNOP命令に置き換える
                                const ds = new DS(line, wordCount, label).setOriginalTokens({
                                    label: labelToken,
                                    instruction: inst
                                });
                                instructions.push(ds);
                            }
                        }
                        break;


                    case ArgumentType.constants_DC:
                        if (consumeConstant()) {
                            const mdcs: MDC[] = [];

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

                            function splitStringLiteralToMdcs(stringToken: TokenInfo, line: number, labelToken?: TokenInfo): void {
                                if (stringToken.type != TokenType.TSTRING) throw new Error();

                                const escaped = validateStringConstant(stringToken);
                                if (escaped === undefined) return;

                                const ch = escaped.charAt(0);
                                const label = labelToken ? labelToken.value : undefined;
                                const mdc = new MDC(label, line, undefined, ch)
                                    .setOriginalTokens({
                                        label: labelToken,
                                        instruction: labelToken ? inst : undefined
                                    });
                                mdcs.push(mdc);
                                for (let i = 1; i < escaped.length; i++) {
                                    const ch = escaped.charAt(i);
                                    const mdc = new MDC(undefined, line, undefined, ch);
                                    mdcs.push(mdc);
                                }
                            }

                            function addMDC(constant: string | number, line: number, labelToken?: TokenInfo) {
                                if (token().type == TokenType.TSTRING) {
                                    splitStringLiteralToMdcs(token(), line, labelToken);
                                } else {
                                    const label = labelToken ? labelToken.value : undefined;
                                    const mdc = new MDC(label, line, constant)
                                        .setOriginalTokens({
                                            label: labelToken,
                                            instruction: labelToken ? inst : undefined
                                        });
                                    mdcs.push(mdc);
                                }
                            }

                            const constant = toConst(token());
                            addMDC(constant, line, labelToken);

                            while (consumeToken(TokenType.TCOMMASPACE, false)) {
                                if (consumeConstant()) {
                                    const constant = toConst(token());
                                    addMDC(constant, line);
                                } else {
                                    break;
                                }
                            }

                            mdcs.forEach(x => instructions.push(x));
                        }
                        break;


                    case ArgumentType.r:
                        if (consumeToken(TokenType.TGR)) {
                            if (allScan()) {
                                const r1Token = token();
                                const r1 = stringToGR(r1Token.value);
                                instruction = new InstructionBase(info.instructionName, line, info.code, label, r1)
                                    .setOriginalTokens({
                                        instruction: inst,
                                        label: labelToken,
                                        r1: r1Token
                                    });
                            }
                        }
                        break;

                    case ArgumentType.r1_adr_r2:
                        createInstruction_r1_adr_r2(info);
                        break;

                    // r1, r2 または r1, adr[, r2]
                    // r1, r2単体の命令は無い
                    case ArgumentType.r1_r2_OR_r1_adr_r2:
                        const next3Token = scanner.get(3);
                        if (isAddressToken(next3Token.type)) {
                            createInstruction_r1_adr_r2(info);
                        } else {
                            // r1, r2
                            if (consumeToken(TokenType.TGR)) {
                                const r1Token = token();
                                const r1 = stringToGR(r1Token.value);
                                if (consumeToken(TokenType.TCOMMASPACE)) {
                                    if (consumeToken(TokenType.TGR) && allScan()) {
                                        const r2Token = token();
                                        const r2 = stringToGR(r2Token.value);
                                        instruction = new InstructionBase(info.instructionName, line, info.code + 4, label, r1, r2)
                                            .setOriginalTokens({
                                                instruction: inst,
                                                label: labelToken,
                                                r1: r1Token,
                                                r2: r2Token
                                            });
                                    }
                                }
                            }
                        }
                        break;

                    default:
                        throw new Error();
                }

                function createInstruction_r1_adr_r2(info: InstructionInfo) {
                    if (consumeToken(TokenType.TGR)) {
                        const r1Token = token();
                        const r1 = stringToGR(r1Token.value);
                        if (consumeToken(TokenType.TCOMMASPACE) && consumeAdr()) {
                            const addressToken = token();
                            const address = toAddress(addressToken);
                            if (allScan(false)) {
                                instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, undefined, address)
                                    .setOriginalTokens({
                                        instruction: inst,
                                        label: labelToken,
                                        r1: r1Token,
                                        address: addressToken
                                    });
                            } else {
                                // r1, adr, r2
                                if (consumeToken(TokenType.TCOMMASPACE) && consumeToken(TokenType.TGR) && allScan()) {
                                    const r2Token = token();
                                    const r2 = stringToGR(r2Token.value);
                                    instruction = new InstructionBase(info.instructionName, line, info.code, label, r1, r2, address)
                                        .setOriginalTokens({
                                            instruction: inst,
                                            label: labelToken,
                                            r1: r1Token,
                                            r2: r2Token,
                                            address: addressToken
                                        });
                                }
                            }
                        }
                    }
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
        if (isNaN(address)) {
            throw new Error();
        } else {
            return address;
        }
    }

    // アドレスは10進数かも
    // 10進数と解釈して変換する
    // 変換に失敗するとNaNが返る
    const address = parseInt(str, 10);
    if (isNaN(address)) {
        throw new Error();
    } else {
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

const tokenMap: Map<TokenType, string> = new Map([
    [TokenType.TINSTRUCTION, "命令"],
    [TokenType.TGR, "GR"],
    [TokenType.TLABEL, "ラベル"],
    [TokenType.TSPACE, "空白"],
    [TokenType.TCOMMASPACE, ","],
    [TokenType.TDECIMALLITERAL, "10進定数リテラル"],
    [TokenType.THEXLITERAL, "16進定数リテラル"],
    [TokenType.TSTRINGLITERAL, "文字定数リテラル"],
    [TokenType.TDECIMAL, "10進定数"],
    [TokenType.THEX, "16進定数"],
    [TokenType.TSTRING, "文字定数"],
    [TokenType.TADDRESS, "アドレス"],
    [TokenType.TCONSTANT, "定数"]
]);
