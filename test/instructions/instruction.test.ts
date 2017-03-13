"use strict";

import { InstructionBase } from "../../src/instructions/instructionBase";
import { LabelMap, LabelInfo } from "../../src/data/labelMap";
import { Casl2 } from "../../src/casl2";
import * as assert from "assert";
import { parseAll } from "../../src/casl2/parser/parser";
import { splitToTokens } from "../../src/casl2/lexer/lexer";
import { createDiagnostic } from "../../src/diagnostics/diagnosticMessage";
import { Diagnostics } from "../../src/diagnostics/diagnosticMessages";
import { createTokenInfo } from "../../src/casl2/lexer/token";

function createInstructions(s: string): Array<InstructionBase> {
    const lineNumber = 0;
    const tokens = splitToTokens(s, lineNumber);
    assert(tokens.success);

    const map = new Map([
        [lineNumber, tokens.value!]
    ]);
    const parse = parseAll(map);

    assert(parse.success);

    const inst = parse.value!;

    return inst;
}

function createInstruction(s: string) {
    return createInstructions(s)[0];
}

function hexTest(line: string, expected: Array<number>) {
    const instruction = createInstruction(line);

    assert.deepEqual(instruction.toHex(), expected);
}

suite("Instruction test", () => {

    // START命令
    test("START test", () => {
        let line = "CASL START";

        let instruction = createInstruction(line);

        assert(instruction.toHex().length == 0);

        line = "CASL START    BEGIN";

        instruction = createInstruction(line);

        // アドレス解決をする
        const map = new LabelMap();
        map.add("BEGIN", { address: 0x03 });
        const token = createTokenInfo("CASL");
        map.bindAdd("CASL", token, "BEGIN");
        instruction.resolveAddress(map);

        const info = map.get("CASL") as LabelInfo;
        assert.equal(info.address, 0x03);
    });

    // END命令
    test("END test", () => {
        // 引数なしパターン
        const line = "    END"
        const instruction = createInstruction(line);

        assert(instruction.toHex().length == 0);
    });

    // DS命令
    test("DS test", () => {
        // ラベル無し
        let line = "    DS  3";
        let ds = createInstructions(line);
        assert(ds.length == 3);
        assert(ds[0].instructionName == "NOP" && ds[0].label == undefined);
        assert(ds[1].instructionName == "NOP" && ds[1].label == undefined);
        assert(ds[2].instructionName == "NOP" && ds[2].label == undefined);

        // ラベル有り
        line = "CONST DS 3";
        ds = createInstructions(line);
        assert(ds.length == 3);
        assert(ds[0].instructionName == "NOP" && ds[0].label == "CONST");
        assert(ds[1].instructionName == "NOP" && ds[1].label == undefined);
        assert(ds[2].instructionName == "NOP" && ds[2].label == undefined);

        // 語数0(ラベル無し)
        // 領域は確保されず何もしないのと同じ
        line = "    DS 0";
        const olbl = createInstruction(line);
        assert(olbl.toHex().length == 0);
    });

    // DC命令
    test("DC test", () => {
        // 10進定数
        let line = "    DC  3";
        let dc = createInstruction(line);
        assert.deepEqual(dc.toHex(), [0x0003]);

        // 16進定数
        line = "    DC #00AB";
        dc = createInstruction(line);
        assert.deepEqual(dc.toHex(), [0x00AB]);

        // 文字列定数(1文字)
        line = "    DC 'A'";
        let mdcs = createInstructions(line);
        assert(mdcs.length == 1);
        // 'A'のアスキーコードは0x41である
        assert.deepEqual(mdcs[0].toHex(), [0x0041]);

        // 文字列定数(2文字以上)
        line = "    DC 'ABC'"
        mdcs = createInstructions(line);
        assert(mdcs.length == 3);
        assert.deepEqual(mdcs[0].toHex(), [0x0041]);
        assert.deepEqual(mdcs[1].toHex(), [0x0042]);
        assert.deepEqual(mdcs[2].toHex(), [0x0043]);

        // ラベル
        line = "    DC L0";
        dc = createInstruction(line) as InstructionBase;
        dc.setScope(1);

        // アドレス解決をする
        const map = new LabelMap();
        map.add("L0", { address: 0x0002 }, 1);
        dc.resolveAddress(map);

        assert.deepEqual(dc.toHex(), [0x0002]);
    });

    test("IN test", () => {
        const line = "    IN BUF, LEN";
        const instruction = createInstruction(line);

        const labelMap = new LabelMap();
        labelMap.add("BUF", { address: 0x0008 }, 1);
        labelMap.add("LEN", { address: 0x0050 }, 1);
        instruction.resolveAddress(labelMap);

        assert.deepEqual(instruction.toHex(), [0x9000, 0x0008, 0x0050]);
    });

    test("OUT test", () => {
        const line = "    OUT BUF, LEN";
        const instruction = createInstruction(line);

        const labelMap = new LabelMap();
        labelMap.add("BUF", { address: 0x0008 }, 1);
        labelMap.add("LEN", { address: 0x0050 }, 1);
        instruction.resolveAddress(labelMap);

        assert.deepEqual(instruction.toHex(), [0x9100, 0x0008, 0x0050]);
    });

    // RPUSH命令
    test("RPUSH test", () => {
        hexTest("    RPUSH", [0xA000]);
    })

    // RPOP命令
    test("RPOP test", () => {
        hexTest("    RPOP", [0xA100]);
    })

    // LD命令
    test("LD test", () => {
        // r1, r2パターン
        hexTest("    LD GR1, GR2", [0x1412]);
        // r1, adrパターン
        hexTest("    LD GR1, 5", [0x1010, 0x0005]);
        // r1, adr, xパターン
        hexTest("    LD GR1, 5, GR2", [0x1012, 0x0005]);
        hexTest("    LD GR1, 0, GR2", [0x1012, 0x0000]);
    });

    // ST命令
    test("ST test", () => {
        // r1, adrパターン
        hexTest("    ST GR1, 5", [0x1110, 0x0005]);
        // r1, adr, xパターン
        hexTest("    ST GR1, 5, GR2", [0x1112, 0x0005]);
    });

    // LAD命令
    test("LAD test", () => {
        // r1, adrパターン
        hexTest("    LAD GR1, 5", [0x1210, 0x0005]);
        hexTest("    LAD GR1, 0", [0x1210, 0x0000]);
        // r1, adr, xパターン
        hexTest("    LAD GR1, 5, GR2", [0x1212, 0x0005]);
        // 10進負数アドレス
        hexTest("    LAD GR1, -1, GR2", [0x1212, 0xFFFF]);
    });

    // ADDA命令
    test("ADDA test", () => {
        // r1, r2パターン
        hexTest("    ADDA GR1, GR2", [0x2412]);
        // r1, adrパターン
        hexTest("    ADDA GR1, 5", [0x2010, 0x0005]);
        // r1, adr, xパターン
        hexTest("    ADDA GR1, 5, GR2", [0x2012, 0x0005]);
    });

    // ADDL命令
    test("ADDL test", () => {
        // r1, r2パターン
        hexTest("    ADDL GR1, GR2", [0x2612]);
        // r1, adrパターン
        hexTest("    ADDL GR1, 5", [0x2210, 0x0005]);
        // r1, adr, xパターン
        hexTest("    ADDL GR1, 5, GR2", [0x2212, 0x0005]);
    });

    // SUBA命令
    test("SUBA test", () => {
        // r1, r2パターン
        hexTest("    SUBA GR1, GR2", [0x2512]);
        // r1, adrパターン
        hexTest("    SUBA GR1, 5", [0x2110, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SUBA GR1, 5, GR2", [0x2112, 0x0005]);
    });

    // SUBL命令
    test("SUBL test", () => {
        // r1, r2パターン
        hexTest("    SUBL GR1, GR2", [0x2712]);
        // r1, adrパターン
        hexTest("    SUBL GR1, 5", [0x2310, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SUBL GR1, 5, GR2", [0x2312, 0x0005]);
    });

    // AND命令
    test("AND test", () => {
        // r1, r2パターン
        hexTest("    AND GR1, GR2", [0x3412]);
        // r1, adrパターン
        hexTest("    AND GR1, 5", [0x3010, 0x0005]);
        // r1, adr, xパターン
        hexTest("    AND GR1, 5, GR2", [0x3012, 0x0005]);
    });

    // OR命令
    test("OR test", () => {
        // r1, r2パターン
        hexTest("    OR GR1, GR2", [0x3512]);
        // r1, adrパターン
        hexTest("    OR GR1, 5", [0x3110, 0x0005]);
        // r1, adr, xパターン
        hexTest("    OR GR1, 5, GR2", [0x3112, 0x0005]);
    });

    // XOR命令
    test("XOR test", () => {
        // r1, r2パターン
        hexTest("    XOR GR1, GR2", [0x3612]);
        // r1, adrパターン
        hexTest("    XOR GR1, 5", [0x3210, 0x0005]);
        // r1, adr, xパターン
        hexTest("    XOR GR1, 5, GR2", [0x3212, 0x0005]);
    });

    // CPA命令
    test("CPA test", () => {
        // r1, r2パターン
        hexTest("    CPA GR1, GR2", [0x4412]);
        // r1, adrパターン
        hexTest("    CPA GR1, 5", [0x4010, 0x0005]);
        // r1, adr, xパターン
        hexTest("    CPA GR1, 5, GR2", [0x4012, 0x0005]);
    });

    // CPL命令
    test("CPL test", () => {
        // r1, r2パターン
        hexTest("    CPL GR1, GR2", [0x4512]);
        // r1, adrパターン
        hexTest("    CPL GR1, 5", [0x4110, 0x0005]);
        // r1, adr, xパターン
        hexTest("    CPL GR1, 5, GR2", [0x4112, 0x0005]);
    });

    // SLA命令
    test("SLA test", () => {
        // r1, adrパターン
        hexTest("    SLA GR1, 5", [0x5010, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SLA GR1, 5, GR2", [0x5012, 0x0005]);
    });

    // SRA命令
    test("SRA test", () => {
        // r1, adrパターン
        hexTest("    SRA GR1, 5", [0x5110, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SRA GR1, 5, GR2", [0x5112, 0x0005]);
    });

    // SLL命令
    test("SLL test", () => {
        // r1, adrパターン
        hexTest("    SLL GR1, 5", [0x5210, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SLL GR1, 5, GR2", [0x5212, 0x0005]);
    });

    // SRL命令
    test("SRL test", () => {
        // r1, adrパターン
        hexTest("    SRL GR1, 5", [0x5310, 0x0005]);
        // r1, adr, xパターン
        hexTest("    SRL GR1, 5, GR2", [0x5312, 0x0005]);
    });

    // JPL命令
    test("JPL test", () => {
        // adrパターン
        hexTest("    JPL 5", [0x6500, 0x0005]);
        // adr, xパターン
        hexTest("    JPL 5, GR2", [0x6502, 0x0005]);
    });

    // JMI命令
    test("JMI test", () => {
        // adrパターン
        hexTest("    JMI 5", [0x6100, 0x0005]);
        // adr, xパターン
        hexTest("    JMI 5, GR2", [0x6102, 0x0005]);
    });

    // JNZ命令
    test("JNZ test", () => {
        // adrパターン
        hexTest("    JNZ 5", [0x6200, 0x0005]);
        // adr, xパターン
        hexTest("    JNZ 5, GR2", [0x6202, 0x0005]);
    });

    // JZE命令
    test("JZE test", () => {
        // adrパターン
        hexTest("    JZE 5", [0x6300, 0x0005]);
        // adr, xパターン
        hexTest("    JZE 5, GR2", [0x6302, 0x0005]);
    });

    // JOV命令
    test("JOV test", () => {
        // adrパターン
        hexTest("    JOV 5", [0x6600, 0x0005]);
        // adr, xパターン
        hexTest("    JOV 5, GR2", [0x6602, 0x0005]);
    });

    // JUMP命令
    test("JUMP test", () => {
        // adrパターン
        hexTest("    JUMP 5", [0x6400, 0x0005]);
        // adr, xパターン
        hexTest("    JUMP 5, GR2", [0x6402, 0x0005]);
    });

    // PUSH命令
    test("PUSH test", () => {
        // adrパターン
        hexTest("    PUSH 5", [0x7000, 0x0005]);
        // adr, xパターン
        hexTest("    PUSH 5, GR2", [0x7002, 0x0005]);
    });

    // POP命令
    test("POP test", () => {
        // rパターン
        hexTest("    POP GR1", [0x7110]);
    });

    // CALL命令
    test("CALL test", () => {
        // adrパターン
        hexTest("    CALL 5", [0x8000, 0x0005]);
        // adr, xパターン
        hexTest("    CALL 5, GR2", [0x8002, 0x0005]);
    });

    // RET命令
    test("RET test", () => {
        // 引数なしパターン
        hexTest("    RET", [0x8100]);
    });

    // SVC命令
    test("SVC test", () => {
        // adrパターン
        hexTest("    SVC 5", [0xF000, 0x0005]);
        // adr, xパターン
        hexTest("    SVC 5, GR2", [0xF002, 0x0005]);
    });

    // NOP命令
    test("NOP test", () => {
        hexTest("    NOP", [0x0000]);
    });
});
