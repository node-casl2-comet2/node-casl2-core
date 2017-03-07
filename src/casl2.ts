"use strict";

import { Instructions } from "./instructions/instructions";
import { InstructionBase } from "./instructions/instructionBase";
import { Lexer } from "./casl2/lexer";
import { LexerResult } from "./casl2/lexerResult";
import { CompileResult } from "./compileResult";
import { LabelMap } from "./data/labelMap";
import { RandomLabelGenerator } from "./helpers/randomLabelGenerator";
import { Casl2CompileOption } from "./compileOption";
import { LexerOption } from "./casl2/lexerOption";
import { Diagnostic } from "./diagnostics/types";
import { createDiagnostic } from "./diagnostics/diagnosticMessage";
import { Diagnostics } from "./diagnostics/diagnosticMessages";

const defaultCompileOption: Casl2CompileOption = {
    useGR8: false,
    enableLabelScope: false
};

export class Casl2 {

    constructor(private _compileOption: Casl2CompileOption = defaultCompileOption) {

    }

    public compile(lines: Array<string>): CompileResult {
        const diagnostics: Array<Diagnostic> = [];
        const instructions: Array<InstructionBase> = [];

        // ='A' → MDC 'A'のように自動生成される命令を格納する
        const generatedInstructions: Array<InstructionBase> = [];

        // コンパイルは3段階で行う
        // フェーズ1: で宣言された定数などはとりあえず置いておいて分かることを解析
        // フェーズ2: =で宣言された定数を配置する
        // フェーズ3: アドレス解決フェーズ
        const lexerOption = {
            useGR8: this._compileOption.useGR8
        };

        function pushDiagnostics(diagnos: Array<Diagnostic>) {
            for (const d of diagnos) {
                diagnostics.push(d);
            }
        }

        // レキサーを生成する
        const lexer = new Lexer(lexerOption);

        // フェーズ1
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // 空行なら無視する
            if (line.trim() === "") continue;

            const tokenizeResult = lexer.tokenize(line, lineNumber);
            if (tokenizeResult.success) {
                const lexerResult = tokenizeResult.value;
                if (!lexerResult) throw new Error();

                if (lexerResult.isCommentLine) {
                    // コメント行なので無視する
                } else {
                    const dsOrDc = lexerResult.instruction === "DS" || lexerResult.instruction === "DC";
                    const createInstructionResult = dsOrDc
                        ? Instructions.createDSDC(lexerResult, lineNumber)
                        : Instructions.create(lexerResult, lineNumber);

                    if (createInstructionResult.success) {
                        const inst = createInstructionResult.value;
                        if (inst === undefined) throw new Error();

                        if (inst instanceof InstructionBase) {
                            instructions.push(inst);
                        }
                        else {
                            inst.forEach(x => instructions.push(x));
                        }
                    } else {
                        const { errors } = createInstructionResult;
                        // コンパイルエラー
                        if (errors) {
                            pushDiagnostics(errors);
                        }
                    }
                }
            } else {
                if (tokenizeResult.errors) {
                    pushDiagnostics(tokenizeResult.errors);
                }
            }
        }

        // フェーズ1の段階でエラーがあればフェーズ2に進まない
        if (diagnostics.length > 0) {
            return new CompileResult(diagnostics, instructions);
        }

        // フェーズ2
        // =で宣言されたリテラルをDC命令として配置する
        instructions.forEach(inst => {
            const literal = inst.getLiteral();
            if (literal != undefined) {
                const label = RandomLabelGenerator.generate();
                // 命令のリテラル部分をDC命令のラベとと置き換える
                inst.replaceLiteralWithLabel(label);

                // リテラルをオペランドとするDC命令を生成する
                const lexerResult = new LexerResult(label, "DC", undefined, undefined, undefined, undefined, undefined, [literal]);
                const createDSDCResult = Instructions.createDSDC(lexerResult, inst.lineNumber!);

                if (createDSDCResult.success) {
                    const dc = createDSDCResult.value;
                    if (dc === undefined) throw new Error();

                    // 生成したDC命令を追加する
                    if (dc instanceof InstructionBase) {
                        generatedInstructions.push(dc);
                    } else {
                        dc.forEach(mdc => generatedInstructions.push(mdc));
                    }
                } else {
                    const { errors } = createDSDCResult;
                    if (errors === undefined) throw new Error();

                    pushDiagnostics(errors);
                }
            }
        });


        // フェーズ3
        // 各ラベルの番地を確定させる
        // ラベルマップを作る


        // 生成された命令を除く命令のバイト数を求める
        let totalByteLength = 0;
        for (let i = 0; i < instructions.length; i++) {
            totalByteLength += instructions[i].byteLength;
        }

        const labelMap = new LabelMap();

        // 生成された命令のラベルに実アドレスを割り当てる
        let globalByteOffset = 0;
        for (let i = 0; i < generatedInstructions.length; i++) {
            const inst = generatedInstructions[i];

            if (inst.label) {
                labelMap.add(inst.label, (totalByteLength + globalByteOffset) / 2);
            }

            globalByteOffset += inst.byteLength;
        }

        // 命令のラベルに実アドレスを割り当てる
        let scope = 1;
        let byteOffset = 0;
        const enableLabelScope = this._compileOption.enableLabelScope === true;
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            // ラベル名に重複があればコンパイルエラーである
            const compileError = () => diagnostics.push(createDiagnostic(inst.lineNumber!, 0, 0, Diagnostics.Duplicate_label_0_, inst.label));

            inst.setScope(scope);

            if (inst.label) {
                if (inst.instructionName === "START" && inst.address != undefined) {
                    if (labelMap.has(inst.label, inst.scope)) compileError();
                    // START命令でadr指定がある場合はadrから開始することになる
                    else labelMap.bindAdd(inst.label, inst.address as string, inst.scope);
                } else {
                    // COMET2は1語16ビット(2バイト)なので2で割っている
                    const address = byteOffset / 2;
                    if (inst.instructionName === "START") {
                        if (labelMap.has(inst.label)) compileError();
                        // サブルーチンのラベルにはグローバルにアクセスできるようにする
                        else labelMap.add(inst.label, address);
                    } else {
                        if (labelMap.has(inst.label, inst.scope)) compileError();
                        else labelMap.add(inst.label, address, inst.scope);
                    }
                }
            }

            byteOffset += inst.byteLength;

            // ラベルのスコープが有効ならばEND命令が来るたびにスコープを変える
            if (enableLabelScope && inst.instructionName === "END") {
                scope++;
            }
        }

        // アドレス解決する
        for (const inst of instructions) {
            const error = inst.resolveAddress(labelMap);
            if (error) {
                diagnostics.push(error);
            }
        }


        if (diagnostics.length == 0) {
            // コンパイル成功の場合
            for (const inst of generatedInstructions) {
                instructions.push(inst);
            }

            const hex = instructions.map(x => x.toHex());
            const flatten = [].concat.apply([], hex) as Array<number>;
            const hexes = flatten.filter(x => x != -1);

            const firstStartInstLabel = instructions[0].label as string;

            const entryPointAddress = labelMap.get(firstStartInstLabel, 1) as number;
            // 先頭16バイト分に実行開始番地を埋め込む
            hexes.unshift(entryPointAddress, 0, 0, 0, 0, 0, 0, 0);

            return new CompileResult(diagnostics, instructions, labelMap, hexes);
        } else {
            return new CompileResult(diagnostics, instructions, labelMap);
        }
    }
}
