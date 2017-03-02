"use strict";

import { Instructions } from "./instructions/instructions";
import { InstructionBase } from "./instructions/instructionBase";
import { CompileError } from "./errors/compileError";
import { Lexer } from "./casl2/lexer";
import { LexerResult } from "./casl2/lexerResult";
import { CompileResult } from "./compileResult";
import { LabelMap } from "./data/labelMap";
import { RandomLabelGenerator } from "./helpers/randomLabelGenerator";
import { Casl2CompileOption } from "./compileOption";
import { LexerOption } from "./casl2/lexerOption";

export class Casl2 {

    constructor(private _compileOption?: Casl2CompileOption) {

    }

    public compile(lines: Array<string>) {
        const errors: Array<CompileError> = [];
        const instructions: Array<InstructionBase> = [];

        // ='A' → MDC 'A'のように自動生成される命令を格納する
        const generatedInstructions: Array<InstructionBase> = [];

        // コンパイルは3段階で行う
        // フェーズ1: で宣言された定数などはとりあえず置いておいて分かることを解析
        // フェーズ2: =で宣言された定数を配置する
        // フェーズ3: アドレス解決フェーズ
        let lexerOption: LexerOption | undefined = undefined;
        if (this._compileOption) {
            lexerOption = {
                useGR8: this._compileOption.useGR8
            };
        }

        // レキサーを生成する
        const lexer = new Lexer(lexerOption);

        // フェーズ1
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // 空行なら無視する
            if (line.trim() === "") continue;

            const result = lexer.tokenize(line, lineNumber);
            if (result instanceof CompileError) {
                errors.push(result);
            } else {
                if (result.isCommentLine) {
                    // コメント行なので無視する
                } else {
                    const dsOrDc = result.instruction === "DS" || result.instruction === "DC";
                    const inst = dsOrDc
                        ? Instructions.createDSDC(result, lineNumber)
                        : Instructions.create(result, lineNumber);

                    if (inst instanceof CompileError) {
                        // コンパイルエラー
                        errors.push(inst);
                    }
                    else if (inst instanceof InstructionBase) {
                        instructions.push(inst);
                    }
                    else {
                        inst.forEach(x => instructions.push(x));
                    }
                }
            }
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
                const dc = Instructions.createDSDC(lexerResult, inst.lineNumber!);

                // 生成したDC命令を追加する
                if (dc instanceof CompileError) {
                    errors.push(dc);
                } else if (dc instanceof InstructionBase) {
                    generatedInstructions.push(dc);
                } else {
                    dc.forEach(mdc => generatedInstructions.push(mdc));
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
        let block = 1;
        let byteOffset = 0;
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];

            inst.setBlock(block);

            if (inst.label) {
                if (labelMap.has(inst.blockedLabel)) {
                    // ラベル名に重複があればコンパイルエラーである
                    errors.push(new CompileError(inst.lineNumber, `Duplicate label: ${inst.label}`));
                } else {
                    if (inst.instructionName === "START" && inst.address != undefined) {
                        // START命令でadr指定がある場合はadrから開始することになる
                        labelMap.bindAdd(inst.label, inst.address as string, inst.block);
                    } else {
                        // サブルーチンのラベルにはグローバルにアクセスできるようにする
                        if (inst.instructionName === "START") {
                            labelMap.add(inst.label, byteOffset / 2);
                        } else {
                            // COMET2は1語16ビット(2バイト)なので2で割っている
                            labelMap.add(inst.label, byteOffset / 2, inst.block);
                        }
                    }
                }
            }

            byteOffset += inst.byteLength;

            // END命令が来るたびにスコープを変える
            if (inst.instructionName === "END") {
                block++;
            }
        }

        // アドレス解決する
        for (const inst of instructions) {
            const error = inst.resolveAddress(labelMap);
            if (error) {
                errors.push(error);
            }
        }


        if (errors.length == 0) {
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

            return new CompileResult(instructions, hexes, errors, labelMap);
        } else {
            return new CompileResult(instructions, [], errors, labelMap);
        }
    }
}
