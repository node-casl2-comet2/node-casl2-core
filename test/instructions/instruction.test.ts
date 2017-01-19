import { Lexer, LexerResult } from '../../src/casl2/lexer';
import { Instructions } from '../../src/instructions/instructions';
import { CompileError } from '../../src/errors/compileError';
import { LabelMap } from '../../src/data/labelMap';
import * as assert from 'assert';

suite("Instruction test", () => {

    // START命令
    test("START test", () => {
        let line = "START";
        let result = Lexer.tokenize(line, 1) as LexerResult;

        let instruction = Instructions.create(result, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), -1);

        line = "START    BEGIN";
        result = Lexer.tokenize(line, 1) as LexerResult;

        instruction = Instructions.create(result, 1);
        if (instruction instanceof CompileError) throw new Error();

        // アドレス解決をする
        let map = new LabelMap([["BEGIN", 0x03]]);
        instruction.resolveAddress(map);

        // TODO: START  BEIGNのようにラベルが指定された場合は
        // JUMPなどに置き換えることになるかも。この時は
        // START専用のInstructionをInstructionBaseを継承して作るとうまく行けそう
        // assert.equal();
    });

    // TODO: END命令

    // TODO: DS命令

    // TODO: DC命令

    // TODO: IN命令

    // TODO: OUT命令

    // TODO: RPUSH命令

    // TODO: RPOP命令

    // TODO: LD命令

    // TODO: ST命令

    // TODO: LAD命令

    // ADDA命令
    test("ADDA test", () => {
        // r1, r2パターン
        let line = "ADDA GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x2412);

        // r1, adrパターン
        line = "ADDA GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x20100005);

        // r1, adr, xパターン
        line = "ADDA GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x20120005);
    });

    // ADDL命令
    test("ADDL test", () => {
        // r1, r2パターン
        let line = "ADDL GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x2612);

        // r1, adrパターン
        line = "ADDL GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x22100005);

        // r1, adr, xパターン
        line = "ADDL GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x22120005);
    });

    // SUBA命令
    test("SUBA test", () => {
        // r1, r2パターン
        let line = "SUBA GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x2512);

        // r1, adrパターン
        line = "SUBA GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x21100005);

        // r1, adr, xパターン
        line = "SUBA GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x21120005);
    });

    // SUBL命令
    test("SUBL test", () => {
        // r1, r2パターン
        let line = "SUBL GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x2712);

        // r1, adrパターン
        line = "SUBL GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x23100005);

        // r1, adr, xパターン
        line = "SUBL GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x23120005);
    });

    // AND命令
    test("AND test", () => {
        // r1, r2パターン
        let line = "AND GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x3412);

        // r1, adrパターン
        line = "AND GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x30100005);

        // r1, adr, xパターン
        line = "AND GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x30120005);
    });

    // OR命令
    test("OR test", () => {
        // r1, r2パターン
        let line = "OR GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x3512);

        // r1, adrパターン
        line = "OR GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x31100005);

        // r1, adr, xパターン
        line = "OR GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x31120005);
    });

    // XOR命令
    test("XOR test", () => {
        // r1, r2パターン
        let line = "XOR GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x3612);

        // r1, adrパターン
        line = "XOR GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x32100005);

        // r1, adr, xパターン
        line = "XOR GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x32120005);
    });

    // CPA命令
    test("CPA test", () => {
        // r1, r2パターン
        let line = "CPA GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x4412);

        // r1, adrパターン
        line = "CPA GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x40100005);

        // r1, adr, xパターン
        line = "CPA GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x40120005);
    });

    // CPL命令
    test("CPL test", () => {
        // r1, r2パターン
        let line = "CPL GR1, GR2";
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x4512);

        // r1, adrパターン
        line = "CPL GR1, 5"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x41100005);

        // r1, adr, xパターン
        line = "CPL GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x41120005);
    });

    // SLA命令
    test("SLA test", () => {
        // r1, adrパターン
        let line = "SLA GR1, 5"
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x50100005);

        // r1, adr, xパターン
        line = "SLA GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x50120005);
    });

    // SRA命令
    test("SRA test", () => {
        // r1, adrパターン
        let line = "SRA GR1, 5"
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x51100005);

        // r1, adr, xパターン
        line = "SRA GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x51120005);
    });

    // SLL命令
    test("SLL test", () => {
        // r1, adrパターン
        let line = "SLL GR1, 5"
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x52100005);

        // r1, adr, xパターン
        line = "SLL GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x52120005);
    });

    // SRL命令
    test("SRL test", () => {
        // r1, adrパターン
        let line = "SRL GR1, 5"
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x53100005);

        // r1, adr, xパターン
        line = "SRL GR1, 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x53120005);
    });

    // JPL命令
    test("JPL test", () => {
        // adrパターン
        let line = "JPL 5"
        let instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x65000005);

        // r1, adr, xパターン
        line = "JPL 5, GR2"
        instruction = Instructions.create(Lexer.tokenize(line, 1) as LexerResult, 1);
        if (instruction instanceof CompileError) throw new Error();

        assert.equal(instruction.toHex(), 0x65020005);
    });

    // TODO: JMI命令

    // TODO: JNZ命令

    // TODO: JZE命令

    // TODO: JOV命令

    // TODO: JUMP命令

    // TODO: PUSH命令

    // TODO: POP命令

    // TODO: CALL命令

    // TODO: RET命令

    // TODO: SVC命令

    // TODO: NOP命令
});