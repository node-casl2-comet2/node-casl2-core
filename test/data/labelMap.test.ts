"use strict";

import { LabelMap, LabelInfo } from "../../src/data/labelMap";
import { TokenInfo, TokenType, createTokenInfo } from "../../src/casl2/lexer/token";

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
        const token: TokenInfo = createTokenInfo("CASL");
        // 'CASL' -> 'BEGIN'
        map.bindAdd("CASL", token, "BEGIN");
        // 'BEGIN' -> 0x03
        map.add("BEGIN", { address: 0x03 });
        const info = map.get("CASL") as LabelInfo;
        assert.equal(info.address, 0x03);
    });
})
