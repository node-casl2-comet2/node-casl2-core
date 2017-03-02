"use strict";

import * as assert from "assert";
import { splitToTokens } from "../../../src/casl2/lexer/tokenizer";
import { CompileError } from "../../../src/errors/compileError";


suite("tokenizer test", () => {
    test("test", () => {
        let line = "CASL    START";
        let result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["CASL", "START"]);

        line = "L1 ST GR3, L2, GR4";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["L1", "ST", "GR3", "L2", "GR4"]);

        line = "L1 LAD GR1, 2";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["L1", "LAD", "GR1", "2"]);

        line = "LAD GR1, 2";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["LAD", "GR1", "2"]);

        line = "L6      DC      3, #00AB, 'A', 'BCD', L0";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["L6", "DC", "3", "#00AB", "'A'", "'BCD'", "L0"]);

        line = "L1 DS 0";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["L1", "DS", "0"]);

        line = "END";
        result = splitToTokens(line, 1) as Array<string>;
        assert.deepEqual(result, ["END"]);

        // 間違った位置にコンマで区切っている
        line = "L1, LAD GR1, 2"
        let error = splitToTokens(line, 1);

        assert(error instanceof CompileError);

        line = "LAD, GR1, 2"
        error = splitToTokens(line, 1);

        assert(error instanceof CompileError);
    });
});
