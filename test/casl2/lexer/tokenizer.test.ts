"use strict";

import * as assert from "assert";
import { splitToTokens } from "../../../src/casl2/lexer/tokenizer";
import { Diagnostics } from "../../../src/diagnostics/diagnosticMessages";
import { createDiagnostic } from "../../../src/diagnostics/diagnosticMessage";

function test2(line: string, expectedTokens: Array<string>) {
    test(line, () => {
        const result = splitToTokens(line, 1);
        assert(result.success);
        assert.deepEqual(result.value, expectedTokens);
    });
}

suite("tokenizer test", () => {
    suite("test", () => {
        const testcases: Array<[string, Array<string>]> = [
            ["CASL    START", ["CASL", "START"]],
            ["L1 ST GR3, L2, GR4", ["L1", "ST", "GR3", "L2", "GR4"]],
            ["L1 LAD GR1, 2", ["L1", "LAD", "GR1", "2"]],
            ["LAD GR1, 2", ["LAD", "GR1", "2"]],
            ["L6      DC      3, #00AB, 'A', 'BCD', L0", ["L6", "DC", "3", "#00AB", "'A'", "'BCD'", "L0"]],
            ["L1 DS 0", ["L1", "DS", "0"]],
            ["END", ["END"]],
        ];

        for (const testcase of testcases) {
            const [line, expectedTokens] = testcase;
            test2(line, expectedTokens);
        }
    });

    test("error patterns", () => {
        const diagnostic = createDiagnostic(1, 0, 0, Diagnostics.Invalid_instruction_line);

        // 間違った位置にコンマで区切っている
        let line = "L1, LAD GR1, 2"
        let result = splitToTokens(line, 1);
        assert(!result.success);
        assert.deepEqual(result.errors![0], diagnostic);

        line = "LAD, GR1, 2"
        result = splitToTokens(line, 1);

        assert(!result.success);
        assert.deepEqual(result.errors![0], diagnostic);
    });
});
