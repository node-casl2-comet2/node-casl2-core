"use strict";

import * as assert from "assert";
import { Casl2 } from "../../src/casl2";
import { binaryTest } from "./binary.test";
import { read } from "../reader";

suite("Compile option tests", () => {
    test("GR8 support test", () => {
        const casFilePath = "./test/testdata/options/gr8.cas";
        const comFilePath = "./test/testdata/options/gr8.com";
        const compiler = new Casl2({
            useGR8: true
        });

        binaryTest(casFilePath, comFilePath, compiler);
    });

    suite("label scope support test", () => {
        const mytest = (enabled: boolean, expectedCompileResult: boolean) => {
            const casFilePath = "./test/testdata/options/labelScope.cas";
            const compiler = new Casl2({
                enableLabelScope: enabled
            });

            const lines = read(casFilePath);
            const result = compiler.compile(lines);
            assert.equal(result.success, expectedCompileResult);
        }

        test("enable label scope", () => {
            mytest(true, true);
        });

        test("disable label scope", () => {
            mytest(false, false);
        });
    });
});
