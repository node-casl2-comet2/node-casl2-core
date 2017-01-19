import { Lexer, LexerResult } from '../../src/casl2/lexer';
import { Instructions } from '../../src/instructions/instructions';
import { CompileError } from '../../src/errors/compileError';
import { LabelMap } from '../../src/data/labelMap';
import * as assert from 'assert';

suite("Instruction test", () => {
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

    // TODO: 各命令のテストを作る
});
