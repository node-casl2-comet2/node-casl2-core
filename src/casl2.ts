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
    public compile(lines: Array<string>, compileOption?: Casl2CompileOption) {
        const errors: Array<CompileError> = [];
        const instructions: Array<InstructionBase> = [];

        // コンパイルは3段階で行う
        // フェーズ1: で宣言された定数などはとりあえず置いておいて分かることを解析
        // フェーズ2: =で宣言された定数を配置する
        // フェーズ3: アドレス解決フェーズ
        let lexerOption: LexerOption | undefined = undefined;
        if (compileOption) {
            lexerOption = {
                useGR8: compileOption.useGR8
            };
        }

        // レキサーを生成する
        const lexer = new Lexer(lexerOption);

        // フェーズ1
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            const result = lexer.tokenize(line, i);
            if (result instanceof CompileError) {
                errors.push(result);
            } else {
                if (result.isCommentLine) {
                    // コメント行なので無視する
                } else {
                    if (result.instruction == "DS") {
                        const ds = Instructions.createDS(result, lineNumber);
                        if (ds instanceof InstructionBase) {
                            instructions.push(ds);
                        } else {
                            ds.forEach(nop => instructions.push(nop));
                        }
                    }
                    else if (result.instruction == "DC") {
                        const dc = Instructions.createDC(result, lineNumber);
                        if (dc instanceof CompileError) {
                            errors.push(dc);
                        } else if (dc instanceof InstructionBase) {
                            instructions.push(dc);
                        } else {
                            dc.forEach(mdc => instructions.push(mdc));
                        }
                    }
                    else if (result.instruction == "IN") {
                        const IN = Instructions.createIN(result, lineNumber);
                        instructions.push(IN);
                    }
                    else if (result.instruction == "OUT") {
                        const out = Instructions.createOUT(result, lineNumber);
                        instructions.push(out);
                    }
                    else {
                        const inst = Instructions.create(result, lineNumber);
                        if (inst instanceof InstructionBase) {
                            instructions.push(inst);
                        }
                        else {
                            // コンパイルエラー
                            errors.push(inst);
                        }
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
                const dc = Instructions.createDC(lexerResult, inst.lineNumber);

                // 生成したDC命令を追加する
                if (dc instanceof CompileError) {
                    errors.push(dc);
                } else if (dc instanceof InstructionBase) {
                    instructions.push(dc);
                } else {
                    dc.forEach(mdc => instructions.push(mdc));
                }
            }
        });


        // フェーズ3
        // 各ラベルの番地を確定させる

        // ラベルマップを作る
        let byteOffset = 0;
        const labelMap = new LabelMap();
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];

            if (inst.label) {
                if (labelMap.has(inst.label)) {
                    // ラベル名に重複があればコンパイルエラーである
                    errors.push(new CompileError(inst.lineNumber, "Duplicate label."));
                } else {
                    if (inst.instructionName === "START" && inst.address != undefined) {
                        // START命令でadr指定がある場合はadrから開始することになる
                        labelMap.bindAdd(inst.label, inst.address as string);
                    } else {
                        // COMET2は1語16ビット(2バイト)なので2で割っている
                        labelMap.add(inst.label, byteOffset / 2);
                    }
                }
            }

            byteOffset += inst.byteLength;
        }

        // アドレス解決する
        instructions.forEach(inst => inst.resolveAddress(labelMap));


        if (errors.length == 0) {
            // コンパイル成功の場合
            const hex = instructions.map(x => x.toHex());
            const flatten = [].concat.apply([], hex) as Array<number>;
            const hexes = flatten.filter(x => x != -1);

            const firstStartInstLabel = instructions[0].label as string;

            // 先頭16バイト分に実行開始番地を埋め込む
            hexes.unshift(labelMap.get(firstStartInstLabel) as number, 0, 0, 0, 0, 0, 0, 0);

            return new CompileResult(instructions, hexes, errors, labelMap);
        } else {
            return new CompileResult(instructions, [], errors, labelMap);
        }
    }
}
