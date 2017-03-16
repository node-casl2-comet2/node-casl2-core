"use strict";

import * as assert from "assert";
import { Casl2 } from "../../src/casl2";

suite("debugging", () => {
    test("debug info", () => {
        const casl2 = new Casl2();
        const result = casl2.compile("./test/testdata/debugging/debug.cas", true);
        const { debuggingInfo } = result;
        if (debuggingInfo === undefined) throw new Error();

        const addressLineMapExpected = new Map([
            [0x00, 1], [0x02, 2], [0x04, 3], [0x05, 4], [0x06, 7],
            [0x08, 8], [0x0A, 9]
        ]);

        const subroutineMapExpected = new Map([
            [0x00, 0], [0x08, 6]
        ]);

        assert.deepEqual(debuggingInfo.addressLineMap, addressLineMapExpected);
        assert.deepEqual(debuggingInfo.subroutineMap, subroutineMapExpected);
    });
});
