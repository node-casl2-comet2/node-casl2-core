"use strict";

import * as assert from "assert";
import { splitToTokens } from "../../src/casl2/lexer/lexer";
import { TokenInfo, TokenType } from "../../src/casl2/lexer/token";

function createTokenInfo(token: string, type: TokenType, startIndex: number, endIndex: number): TokenInfo {
    return {
        value: token,
        type: type,
        line: 1,
        startIndex: startIndex,
        endIndex: endIndex
    };
}

function testSplitToTokens(line: string, expected: Array<[string, TokenType, number, number]>) {
    const tokens = splitToTokens(line, 1);
    assert(tokens.success);

    const expected2 = expected.map(x => {
        const [a, b, c, d] = x;
        return createTokenInfo(a, b, c, d);
    });

    assert.deepEqual(tokens.value!, expected2);
}

suite("lexer test", () => {
    test("splitToTokens", () => {
        const line = "L1 LAD GR1,10,#20,'ABC',=10,=#20,='ABC'; HELLO";
        testSplitToTokens(line, [
            ["L1", TokenType.TLABEL, 0, 2],
            [" ", TokenType.TSPACE, 2, 3],
            ["LAD", TokenType.TINSTRUCTION, 3, 6],
            [" ", TokenType.TSPACE, 6, 7],
            ["GR1", TokenType.TGR, 7, 10],
            [",", TokenType.TCOMMASPACE, 10, 11],
            ["10", TokenType.TDECIMAL, 11, 13],
            [",", TokenType.TCOMMASPACE, 13, 14],
            ["#20", TokenType.THEX, 14, 17],
            [",", TokenType.TCOMMASPACE, 17, 18],
            ["'ABC'", TokenType.TSTRING, 18, 23],
            [",", TokenType.TCOMMASPACE, 23, 24],
            ["=10", TokenType.TDECIMALLITERAL, 24, 27],
            [",", TokenType.TCOMMASPACE, 27, 28],
            ["=#20", TokenType.THEXLITERAL, 28, 32],
            [",", TokenType.TCOMMASPACE, 32, 33],
            ["='ABC'", TokenType.TSTRINGLITERAL, 33, 39],
            ["; HELLO", TokenType.TCOMMENT, 39, 46]
        ]);
    });
});
