"use strict";

import * as assert from "assert";
import { convertToCharCode, isStrInRange } from "../../src/helpers/jisx0201";

suite("JIS X 0201 test", () => {
    test("convert test", () => {
        assert.equal(convertToCharCode("A"), 0x41);
    });

    test("isStrInRange test", () => {
        assert(isStrInRange("ABCDE"));
        assert(!isStrInRange("あいうえお"));
    });
});
