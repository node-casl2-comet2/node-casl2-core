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
    TGR,
    TSPACE,
    TINSTRUCTION,
    TCOMMA,
    TDECIMALLITERAL,
    THEXLITERAL,
    TSTRINGLITERAL,
    TDECIMAL,
    THEX,
    TLABEL,
    TSTRING,
    TCOMMENT,
    TUNKNOWN
};

export const TokenDefinitions: Array<TokenDefinition> = [
    new TokenDefinition(TokenType.TINSTRUCTION, /\b(START|END|DS|DC|IN|OUT|RPUSH|RPOP|LD|ST|LAD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL|SLA|SRA|SLL|SRL|JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|POP|CALL|RET|SVC|NOP)\b/),
    new TokenDefinition(TokenType.TGR, /GR\d/),
    new TokenDefinition(TokenType.TLABEL, /[A-Z][0-9A-Z]*/),
    new TokenDefinition(TokenType.TSPACE, /\s+/),
    new TokenDefinition(TokenType.TCOMMA, /,/),
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

