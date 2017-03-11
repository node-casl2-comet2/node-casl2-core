"use strict";

import { InstructionBase } from "./instructions/instructionBase";
import { TokenType } from "./casl2/lexer/token";
import { CompileResult } from "./compileResult";
import { LabelMap } from "./data/labelMap";
import { RandomLabelGenerator } from "./helpers/randomLabelGenerator";
import { Casl2CompileOption } from "./compileOption";
import { LexerOption } from "./casl2/lexerOption";
import { Diagnostic } from "./diagnostics/types";
import { createDiagnostic } from "./diagnostics/diagnosticMessage";
import { Diagnostics } from "./diagnostics/diagnosticMessages";

import { parseAll } from "./casl2/parser/parser"
import { splitToTokens } from "./casl2/lexer/lexer";
import { TokenInfo } from "./casl2/lexer/token";

const defaultCompileOption: Casl2CompileOption = {
    useGR8: false,
    enableLabelScope: false
};

export interface Casl2DiagnosticResult {
    diagnostics: Array<Diagnostic>;
    instructions: Array<InstructionBase>;
    generatedInstructions: Array<InstructionBase>;
    labelMap: LabelMap;
}

export class Casl2 {

    constructor(private _compileOption: Casl2CompileOption = defaultCompileOption) {

    }

    analyze(lines: Array<string>): Casl2DiagnosticResult {
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

        // フェーズ1

        const tokensList: Array<Array<TokenInfo>> = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i;
            if (line.trim() === "") continue;

            const tokens = splitToTokens(line, lineNumber);
            if (tokens.success) {
                tokensList.push(tokens.value!);
            } else {
                pushDiagnostics(tokens.errors!);
            }
        }

        const result = parseAll(tokensList);
        if (result.success) {
            result.value!.forEach(x => instructions.push(x));
        } else {
            pushDiagnostics(result.errors!);
        }


        // フェーズ2
        // =で宣言されたリテラルをDC命令として配置する
        instructions.forEach(inst => {
            const literal = inst.getLiteral();
            if (literal != undefined) {
                const label = RandomLabelGenerator.generate();
                // 命令のリテラル部分をDC命令のラベルと置き換える
                inst.replaceLiteralWithLabel(label);

                const l = {
                    value: label,
                    type: TokenType.TLABEL,
                    line: -1,
                    startIndex: -1,
                    endIndex: -1
                };

                // リテラルをオペランドとするDC命令を生成する
                const dcLine = `    DC    ${literal}`;
                const mdcs = parseAll([splitToTokens(dcLine, 1).value!]);

                mdcs.value![0].setLabel(label);

                if (mdcs.success) {
                    const dc = mdcs.value;
                    if (dc === undefined) throw new Error();

                    // 生成したDC命令を追加する
                    dc.forEach(mdc => generatedInstructions.push(mdc));
                } else {
                    const { errors } = mdcs;
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
            const compileError = () =>
                diagnostics.push(createDiagnostic(inst.lineNumber!, 0, 0, Diagnostics.Duplicate_label_0_, inst.label!));

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

        for (const inst of instructions) {
            for (const d of inst.check()) {
                diagnostics.push(d);
            }
        }

        return {
            diagnostics: diagnostics,
            instructions: instructions,
            generatedInstructions: generatedInstructions,
            labelMap: labelMap
        }
    }

    public compile(lines: Array<string>): CompileResult {
        const { diagnostics, instructions, generatedInstructions, labelMap } = this.analyze(lines);

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
