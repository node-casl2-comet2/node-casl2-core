'use strict';

import { Instructions } from './instructions/instructions';
import { InstructionBase } from './instructions/instructionBase';
import { CompileError } from './errors/compileError';
import { Lexer } from './casl2/lexer';
import { CompileResult } from './compileResult';
import { LabelMap } from './data/labelMap';

export class Casl2 {
    public compile(lines: Array<string>) {
        let errors: Array<CompileError> = [];
        let instructions: Array<InstructionBase> = [];

        // コンパイルは3段階で行う
        // フェーズ1: で宣言された定数などはとりあえず置いておいて分かることを解析
        // フェーズ2: =で宣言された定数を配置する
        // フェーズ3: アドレス解決フェーズ

        // フェーズ1
        for (var i = 0; i < lines.length; i++) {
            let line = lines[i];
            let lineNumber = i + 1;

            let result = Lexer.tokenize(line, i);
            if (result instanceof CompileError) {
                errors.push(result);
            } else {
                if (result.isCommentLine) {
                    // コメント行なので無視する
                } else {
                    if (result.instruction == 'DS') {
                        let ds = Instructions.createDS(result, lineNumber);
                        if (ds instanceof InstructionBase) {
                            instructions.push(ds);
                        } else {
                            ds.forEach(nop => instructions.push(nop));
                        }
                    }
                    else if (result.instruction == 'DC') {
                        let dc = Instructions.createDC(result, lineNumber);
                        if (dc instanceof InstructionBase) {
                            instructions.push(dc);
                        } else {
                            dc.forEach(mdc => instructions.push(mdc));
                        }
                    } else {
                        let inst = Instructions.create(result, lineNumber);
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

        // TODO: フェーズ2

        // フェーズ3
        // 各ラベルの番地を確定させる

        // ラベルマップを作る
        let byteOffset = 0;
        let labelMap = new LabelMap();
        for (var i = 0; i < instructions.length; i++) {
            let inst = instructions[i];

            if (inst.label) {
                if (labelMap.has(inst.label)) {
                    // ラベル名に重複があればコンパイルエラーである
                    errors.push(new CompileError(inst.lineNumber, "Duplicate label."));
                } else {
                    // COMET2は1語16ビット(2バイト)なので2で割っている
                    labelMap.add(inst.label, byteOffset / 2);
                }
            }

            byteOffset += inst.byteLength;
        }

        // アドレス解決する
        instructions.forEach(inst => inst.resolveAddress(labelMap));

        return new CompileResult(instructions, errors);
    }
}
