"use strict";

import { LabelMap, LabelInfo } from "../../src/data/labelMap";

import * as assert from "assert";

suite("LabelMap test", () => {
    test("test add", () => {
        const map = new LabelMap();
        // 'L1' -> 0x03
        map.add("L1", { address: 0x03 });
        const info = map.get("L1") as LabelInfo;
        assert.equal(info.address, 0x03);
    });

    test("test bindAdd", () => {
        const map = new LabelMap();
        // 'CASL' -> 'BEGIN'
        map.bindAdd("CASL", "BEGIN");
        // 'BEGIN' -> 0x03
        map.add("BEGIN", { address: 0x03 });
        const info = map.get("CASL") as LabelInfo;
        assert.equal(info.address, 0x03);
    });
})
