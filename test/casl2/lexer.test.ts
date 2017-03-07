"use strict";

import { Lexer } from "../../src/casl2/lexer";
import { LexerResult } from "../../src/casl2/lexerResult";
import { Diagnostic } from "../../src/diagnostics/types";
import { GR } from "@maxfield/node-casl2-comet2-core-common";
import * as assert from "assert";
import { Diagnostics } from "../../src/diagnostics/diagnosticMessages";
import { createDiagnostic } from "../../src/diagnostics/diagnosticMessage";

function getLexerResult(s: string): LexerResult {
    const result = Lexer.tokenize(s, 3);

    assert(result.success);
    const r = result.value!;

    return r;
}

suite("Lexer test", () => {
    test("tokenize test: label + instruction no args", () => {
        const line = "CASL2 START";
        const r = getLexerResult(line);

        assert.equal(r.label, "CASL2");
        assert.equal(r.instruction, "START");
        assert.equal(r.r1, undefined);
        assert.equal(r.r2, undefined);
        assert.equal(r.address, undefined);
        assert.equal(r.comment, undefined);
    });

    test("tokenize test: instruction (no args)", () => {
        const line = "NOP";
        const r = getLexerResult(line);

        assert.equal(r.label, undefined);
        assert.equal(r.instruction, "NOP");
        assert.equal(r.r1, undefined);
        assert.equal(r.r2, undefined);
        assert.equal(r.address, undefined);
        assert.equal(r.comment, undefined);
    });

    test("tokenize test: label + instruction r1, r2", () => {
        const line = "ADD    ADDA GR0, GR1";
        const r = getLexerResult(line);

        assert.equal(r.label, "ADD");
        assert.equal(r.instruction, "ADDA");
        assert.equal(r.r1, GR.GR0);
        assert.equal(r.r2, GR.GR1);
        assert.equal(r.address, undefined);
        assert.equal(r.comment, undefined);
    });

    test("tokenize test: instruction + r1, r2 + comment", () => {
        const line = "ADDA GR0, GR1 ;windows";
        const r = getLexerResult(line);

        assert.equal(r.label, undefined);
        assert.equal(r.instruction, "ADDA");
        assert.equal(r.r1, GR.GR0);
        assert.equal(r.r2, GR.GR1);
        assert.equal(r.address, undefined);
        assert.equal(r.comment, ";windows");
    });

    test("tokenize test: label + instruction + r, adr(number), x", () => {
        const line = "L1   LAD GR0, 3, GR1";
        const r = getLexerResult(line);

        assert.equal(r.label, "L1");
        assert.equal(r.instruction, "LAD");
        assert.equal(r.r1, GR.GR0);
        assert.equal(r.r2, GR.GR1);
        assert.equal(r.address, 3);
        assert.equal(r.comment, undefined);
    });

    test("tokenize test: instruction + r, adr(label), x", () => {
        const line = "LAD GR0, ONE, GR1";
        const r = getLexerResult(line);

        assert.equal(r.label, undefined);
        assert.equal(r.instruction, "LAD");
        assert.equal(r.r1, GR.GR0);
        assert.equal(r.r2, GR.GR1);
        assert.equal(r.address, "ONE");
        assert.equal(r.comment, undefined);
    });

    test("tokenize test: comment", () => {
        const line = "; THIS IS COMMENT";
        const r = getLexerResult(line);

        assert.equal(r.label, undefined);
        assert.equal(r.instruction, undefined);
        assert.equal(r.r1, undefined);
        assert.equal(r.r2, undefined);
        assert.equal(r.address, undefined);
        assert.equal(r.comment, "; THIS IS COMMENT");
    });

    // 不明な命令はエラー
    test("tokenize error test: invalid instruction", () => {
        // MUL命令は存在しない
        const line = "L1   MUL GR1, GR2";
        const result = Lexer.tokenize(line, 3);

        assert(!result.success);
        const error = result.errors![0];
        assert.deepEqual(error, createDiagnostic(3, 0, 0, Diagnostics.Invalid_instruction_0_, "MUL"));
    });

    // ラベル名に不正な文字を含んでいる
    suite("tokenize error test: invalid character used for label", () => {
        // 小文字を使っている
        test("lower case", () => {
            const line = "l1  ADDA    GR1, GR2";
            const result = Lexer.tokenize(line, 3);


            assert(!result.success);
            const error = result.errors![0];
            assert.deepEqual(error, createDiagnostic(3, 0, 0, Diagnostics.Invalid_label_0_, "l1"));
        });

        // TODO: エラーチェックをする
        // ラベル名の一文字目が数字である
        test("first character is a number", () => {
            const line = "1L  ADDA GR1, GR2";
            const result = Lexer.tokenize(line, 3);
            assert(!result.success);
        });
    });

    // ラベル名は8文字まで有効
    test("tokenize test: label name can be up to 8 characters", () => {
        const line = "ABCDEFGH  ADDA    GR1, GR2";
        const result = Lexer.tokenize(line, 3);
        assert(result.success);
    });

    // TODO: エラーチェックをする
    // ラベル名が長すぎる(9文字以上)
    test("tokenize error test: too long label name", () => {
        const line = "ABCDEFGHI  ADDA    GR1, GR2";
        const result = Lexer.tokenize(line, 3);
        assert(!result.success);
    });
});
