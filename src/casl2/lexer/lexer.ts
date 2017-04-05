"use strict";

"use strict";

import { Diagnostic } from "../../diagnostics/types";
import { Diagnostics } from "../../diagnostics/diagnosticMessages";
import { createDiagnostic } from "../../diagnostics/diagnosticMessage";
import { TokenDefinitions, TokenType, TokenInfo } from "../lexer/token";
import { Expected } from "../../expected";

export function splitToTokens(line: string, lineNumber: number): Expected<TokenInfo[], Diagnostic> {
    const result: TokenInfo[] = [];

    const createError = (startIndex: number, endIndex: number) => createDiagnostic(lineNumber, startIndex, endIndex, Diagnostics.Invalid_instruction_line);
    function createTokenInfo(token: string, type: TokenType, startIndex: number, endIndex: number): TokenInfo {
        return {
            value: token,
            type: type,
            line: lineNumber,
            startIndex: startIndex,
            endIndex: endIndex
        };
    }

    function tryMatch(str: string, currentIndex: number): [boolean, number] {
        const rest = str.slice(currentIndex);

        for (const tDef of TokenDefinitions) {
            const match = tDef.match(rest);
            // 文字列の先頭でマッチしたか?
            if (match !== undefined && match.index == 0) {
                const token = match[0];
                const newIndex = currentIndex + token.length;
                const tInfo = createTokenInfo(token, tDef.type, currentIndex, newIndex);
                result.push(tInfo);

                return [true, newIndex];
            }
        }

        return [false, currentIndex];
    }

    let index = 0;

    while (index < line.length) {
        const [matched, newIndex] = tryMatch(line, index);
        if (matched) {
            index = newIndex;
        } else {
            return {
                success: false,
                value: result,
                errors: [createError(index, Number.MAX_VALUE)]
            };
        }
    }

    return {
        success: true,
        value: result
    };
}
