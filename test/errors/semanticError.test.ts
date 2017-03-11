"use strict";

import * as assert from "assert";
import { parseAll } from "../../src/casl2/parser/parser";
import { splitToTokens } from "../../src/casl2/lexer/lexer";
import { Casl2 } from "../../src/casl2";
import { createDiagnostic } from "../../src/diagnostics/diagnosticMessage";
import { Diagnostics } from "../../src/diagnostics/diagnosticMessages";


suite("semantic error", () => {
    test("jis x 0201", () => {
        // JIS X 0201の範囲外の文字列定数
        const line = "    DC 'あいう'";

        const tokens = splitToTokens(line, 1);
        assert(tokens.success);

        const map = new Map([
            [1, tokens.value!]
        ]);
        const parse = parseAll(map);

        assert(!parse.success);

        assert.deepEqual(parse.errors![0], createDiagnostic(1, 7, 12, Diagnostics.JIS_X_0201_out_of_range));
    });

    test("label", () => {
        const casl2 = new Casl2();
        const diagnostics = casl2.analyze(["ABCDEFGHI  ADDA    GR1, GR2"]).diagnostics;
        assert(diagnostics.length == 1);

        assert.deepEqual(diagnostics[0], createDiagnostic(0, 0, 9, Diagnostics.Too_long_label_name));
    });
});
