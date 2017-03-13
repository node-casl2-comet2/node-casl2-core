"use strict";

export class TokenDefinition {
    constructor(private _type: TokenType, private _pattern: RegExp) {

    }

    get type(): TokenType {
        return this._type;
    }

    match(str: string) {
        return str.match(this._pattern) || undefined;
    }
}

export enum TokenType {
    TGR = 0,
    TSPACE = 1,
    TINSTRUCTION = 2,
    TCOMMASPACE = 3,
    TDECIMALLITERAL = 4,
    THEXLITERAL = 5,
    TSTRINGLITERAL = 6,
    TDECIMAL = 7,
    THEX = 8,
    TLABEL = 9,
    TSTRING = 10,
    TCOMMENT = 11,

    TADDRESS = 20,
    TCONSTANT = 21,
    TUNKNOWN = 22
};

export const TokenDefinitions: Array<TokenDefinition> = [
    new TokenDefinition(TokenType.TINSTRUCTION, /\b(START|END|DS|DC|IN|OUT|RPUSH|RPOP|LD|ST|LAD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL|SLA|SRA|SLL|SRL|JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|POP|CALL|RET|SVC|NOP)\b/),
    new TokenDefinition(TokenType.TGR, /GR\d/),
    new TokenDefinition(TokenType.TLABEL, /[A-Z][0-9A-Z]*/),
    new TokenDefinition(TokenType.TSPACE, /\s+/),
    new TokenDefinition(TokenType.TCOMMASPACE, /\s*,\s*/),
    new TokenDefinition(TokenType.TDECIMALLITERAL, /=-?\d+/),
    new TokenDefinition(TokenType.THEXLITERAL, /=#[0-9A-F]+/),
    new TokenDefinition(TokenType.TSTRINGLITERAL, /='(('')|[^'])+?'/),
    new TokenDefinition(TokenType.TDECIMAL, /-?\d+/),
    new TokenDefinition(TokenType.THEX, /#[0-9A-F]+/),
    new TokenDefinition(TokenType.TSTRING, /'(('')|[^'])+?'/),
    new TokenDefinition(TokenType.TCOMMENT, /;.*$/)
];

export interface TokenInfo {
    value: string;
    type: TokenType;
    line: number;
    startIndex: number;
    endIndex: number;
}

export function isAddressToken(t: TokenType): boolean {
    const r = t == TokenType.TLABEL
        || t == TokenType.TINSTRUCTION
        || t == TokenType.TDECIMAL
        || t == TokenType.THEX
        || t == TokenType.TDECIMALLITERAL
        || t == TokenType.THEXLITERAL
        || t == TokenType.TSTRINGLITERAL;

    return r;
}

export function isConstantToken(t: TokenType): boolean {
    const r = t == TokenType.TDECIMAL || t == TokenType.THEX
        || t == TokenType.TSTRING || t == TokenType.TLABEL;

    return r;
}
