"use strict";

import * as assert from "assert";
import { Casl2 } from "../../src/casl2";
import { MemoryRange } from "@maxfield/node-casl2-comet2-core-common";

function compile(path: string) {
    const casl2 = new Casl2();
    const result = casl2.compile(path, true);
    const { debuggingInfo } = result;
    if (debuggingInfo === undefined) throw new Error();

    return debuggingInfo;
}

suite("debugging", () => {
    test("address line map and subroutine map", () => {
        const debuggingInfo = compile("./test/testdata/debugging/debug.cas");

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

    test("ds ranges", () => {
        const debuggingInfo = compile("./test/testdata/debugging/dsRanges.cas");

        const dsRangesExpected: Array<MemoryRange> = [
            { start: 2, end: 12 },
            { start: 14, end: 34 }
        ];

        assert.deepEqual(debuggingInfo.dsRanges, dsRangesExpected);
    });
});
