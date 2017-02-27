"use strict";

import * as assert from "assert";
import { binaryRead } from "./binaryReader";
import * as path from "path";
import { Casl2 } from "../src/casl2";
import { read } from "./reader";
import * as fs from "fs";

const defaultCompiler = new Casl2();

function compile(casFilePath: string, compiler?: Casl2) {
    const lines = read(casFilePath);
    const compilerToUse = compiler || defaultCompiler;

    const result = compilerToUse.compile(lines);

    assert(result.success);

    const { hexes } = result;
    return result.hexes;
}

function binaryTest(casFilePath: string, comFilePath: string, compiler?: Casl2) {
    const expected = binaryRead(comFilePath);
    const actual = compile(casFilePath, compiler);

    assert.deepEqual(expected, actual);
}

suite("binary test", () => {
    test("test", () => {
        const folders = [
            "ds", "in", "mix", "other", "out", "rpop", "rpush", "start"
        ];

        for (const dir of folders) {
            const folder = path.join("./test/testdata/", dir);
            const files = fs.readdirSync(folder);
            const casFiles = files.filter(x => x.match(/.*\.cas$/));

            for (const casFile of casFiles) {
                const casFilePath = path.join(folder, casFile);

                const comFile = casFile.replace(".cas", ".com");
                const comFilePath = path.join(folder, comFile);

                binaryTest(casFilePath, comFilePath);
            }
        }
    });

    test("GR8 support test", () => {
        const casFilePath = "./test/testdata/options/gr8.cas";
        const comFilePath = "./test/testdata/options/gr8.com";
        const compiler = new Casl2({
            useGR8: true
        });

        binaryTest(casFilePath, comFilePath, compiler);
    });
});
