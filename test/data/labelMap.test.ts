"use strict";

import { LabelMap } from "../../src/data/labelMap";

import * as assert from "assert";

suite("LabelMap test", () => {
    test("test add", () => {
        const map = new LabelMap();
        // 'L1' -> 0x03
        map.add("L1", 0x03);
        assert.equal(map.get("L1") as number, 0x03);
    });

    test("test bindAdd", () => {
        const map = new LabelMap();
        // 'CASL' -> 'BEGIN'
        map.bindAdd("CASL", "BEGIN");
        // 'BEGIN' -> 0x03
        map.add("BEGIN", 0x03);
        assert.equal(map.get("CASL") as number, 0x03);
    });
})
