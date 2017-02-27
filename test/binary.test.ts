"use strict";

import * as assert from "assert";
import { binaryRead } from "./binaryReader";
import * as path from "path";
import { Casl2 } from "../src/casl2";
import { read } from "./reader";

const casl2 = new Casl2();

function compile(casFilePath: string) {
    const lines = read(casFilePath);
    const result = casl2.compile(lines);

    assert(result.success);

    const {hexes} = result;
    return result.hexes;
}

suite("binary test", () => {
    test("test", () => {
        const casFile = "./test/testdata/start/start1.cas";
        const comFile = "./test/testdata/start/start1.com";

        const expected = binaryRead(comFile);
        const actual = compile(casFile);

        assert.deepEqual(expected, actual);
    });
});
