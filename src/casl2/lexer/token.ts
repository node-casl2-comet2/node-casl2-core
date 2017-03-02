"use strict";

export class TokenDefinition {
    constructor(private _tokenID: string, private _pattern: RegExp) {

    }

    get tokenID(): string {
        return this._tokenID;
    }

    match(str: string) {
        return str.match(this._pattern) || undefined;
    }
}

export const TokenIDs = {
    TGR: "TGR",
    TSPACE: "TSPACE",
    TCOMMA: "TCOMMA",
    TDECIMALLITERAL: "TDECIMALLITERAL",
    THEXLITERAL: "THEXLITERAL",
    TSTRINGLITERAL: "TSTRINGLITERAL",
    TDECIMAL: "TDECIMAL",
    THEX: "THEX",
    TLABEL: "TLABEL",
    TSTRING: "TSTRING",
};

export const TokenDefinitions: Array<TokenDefinition> = [
    new TokenDefinition(TokenIDs.TLABEL, /[A-Z][0-9A-Z]*/),
    new TokenDefinition(TokenIDs.TGR, /GR\d/),
    new TokenDefinition(TokenIDs.TSPACE, /\s+/),
    new TokenDefinition(TokenIDs.TCOMMA, /,/),
    new TokenDefinition(TokenIDs.TDECIMAL, /=-?\d+/),
    new TokenDefinition(TokenIDs.THEXLITERAL, /=#[0-9A-F]+/),
    new TokenDefinition(TokenIDs.TSTRINGLITERAL, /='(('')|[^'])+?'/),
    new TokenDefinition(TokenIDs.TDECIMAL, /-?\d+/),
    new TokenDefinition(TokenIDs.THEX, /#[0-9A-F]+/),
    new TokenDefinition(TokenIDs.TSTRING, /'(('')|[^'])+?'/),
];
