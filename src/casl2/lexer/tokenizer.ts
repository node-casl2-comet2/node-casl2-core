"use strict";

import { CompileError } from "../../errors/compileError";
import { TokenDefinitions, TokenIDs } from "./token";

export function splitToTokens(line: string, lineNumber: number): Array<string> | CompileError {
    const trim = line.trim();
    const result: Array<string> = [];

    const compileError = () => new CompileError(lineNumber, "cannot split to tokens");

    let arg = "";

    // ラベルまたは命令をキャプチャ
    const m1 = trim.match(/^([^\s,]+)(.*)$/);
    if (!m1) return compileError();
    result.push(m1[1]);

    const rest = m1[2].trim();
    if (rest.startsWith(",")) return compileError();

    // 命令をキャプチャ
    const m2 = rest.match(/^([^\s,]+)\s+(.*)$/);
    if (m2) {
        result.push(m2[1]);
        const rest = m2[2].trim();
        arg = rest;
    } else {
        arg = rest;
    }



    if (arg.length > 0) {
        const tryMatch = (str: string, currentIndex: number): [boolean, number] => {
            const rest = str.slice(currentIndex);

            for (const tDef of TokenDefinitions) {
                const match = tDef.match(rest);
                // 文字列の先頭でマッチしたか?
                if (match !== undefined && match.index == 0) {
                    const token = match[0];
                    const newIndex = currentIndex + token.length;
                    if (!(tDef.tokenID === TokenIDs.TCOMMA || tDef.tokenID === TokenIDs.TSPACE)) {
                        result.push(token);
                    }
                    return [true, newIndex];
                }
            }

            return [false, currentIndex];
        };

        let index = 0;

        while (index < arg.length) {
            const [matched, newIndex] = tryMatch(arg, index);
            if (matched) {
                index = newIndex;
            } else {
                return compileError();
            }
        }
    }

    return result;
}
