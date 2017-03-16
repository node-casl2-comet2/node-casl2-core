"use strict";

import { InstructionBase } from "./instructions/instructionBase";
import { TokenType } from "./casl2/lexer/token";
import { CompileResult, DebuggingInfo } from "./compileResult";
import { LabelMap, LabelInfo } from "./data/labelMap";
import { RandomLabelGenerator } from "./helpers/randomLabelGenerator";
import { Casl2CompileOption } from "./compileOption";
import { LexerOption } from "./casl2/lexerOption";
import { Diagnostic } from "./diagnostics/types";
import { createDiagnostic } from "./diagnostics/diagnosticMessage";
import { Diagnostics } from "./diagnostics/diagnosticMessages";

import { parseAll } from "./casl2/parser/parser"
import { splitToTokens } from "./casl2/lexer/lexer";
import { TokenInfo } from "./casl2/lexer/token";
import { read } from "./reader";

const defaultCompileOption: Casl2CompileOption = {
    useGR8: false,
    enableLabelScope: true
};

export interface LineTokensInfo {
    tokens: Array<TokenInfo>;
    success: boolean;
}

export interface Casl2DiagnosticResult {
    subroutinesInfo: Array<SubroutineInfo>;
    tokensMap: Map<number, LineTokensInfo>;
    scopeMap: Map<number, number>;
    diagnostics: Array<Diagnostic>;
    instructions: Array<InstructionBase>;
    generatedInstructions: Array<InstructionBase>;
    labelMap: LabelMap;
}

export interface SubroutineInfo {
    /** サブルーチン名 */
    subroutine: string;
    /** サブルーチン開始行 */
    startLine: number;
    /** サブルーチン終了行 */
    endLine: number;
}

export class Casl2 {

    constructor(private _compileOption: Casl2CompileOption = defaultCompileOption) {

    }

    analyze(lines: Array<string>): Casl2DiagnosticResult {
        const diagnostics: Array<Diagnostic> = [];
        const instructions: Array<InstructionBase> = [];
        const tokensMap: Map<number, LineTokensInfo> = new Map();

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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i;
            const tokens = splitToTokens(line, lineNumber);
            tokensMap.set(lineNumber, { tokens: tokens.value!, success: tokens.success });

            if (!tokens.success) {
                pushDiagnostics(tokens.errors!);
            }
        }

        const result = parseAll(tokensMap);
        if (result.success) {
            result.value!.forEach(x => instructions.push(x));
        } else {
            result.value!.forEach(x => instructions.push(x));
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

                // リテラルをオペランドとするDC命令を生成する
                const dcLine = `    DC    ${literal}`;
                const map = new Map([
                    [-1, { tokens: splitToTokens(dcLine, -1).value!, success: true }]
                ]);
                const mdcs = parseAll(map);

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
                const address = (totalByteLength + globalByteOffset) / 2;
                labelMap.add(inst.label, { address });
            }

            globalByteOffset += inst.byteLength;
        }

        const scopeMap = new Map<number, number>();
        const subroutinesInfo: Array<SubroutineInfo> = [];
        let lastScopeSetLine = -1;
        // 命令のラベルに実アドレスを割り当てる
        let scope = 1;
        let byteOffset = 0;
        const enableLabelScope = this._compileOption.enableLabelScope === true;
        let subroutineInfo: SubroutineInfo = { subroutine: "", startLine: -1, endLine: -1 };
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            // ラベル名に重複があればコンパイルエラーである
            const compileError = () =>
                diagnostics.push(createDiagnostic(inst.lineNumber!, 0, 0, Diagnostics.Duplicate_label_0_, inst.label!));

            inst.setScope(scope);

            if (inst.label) {
                registerLabelToLabelMap(inst);

                if (inst.instructionName === "START") {
                    subroutineInfo.subroutine = inst.label;
                    subroutineInfo.startLine = inst.lineNumber;
                }
            }

            byteOffset += inst.byteLength;

            updateScopeMap();

            if (inst.instructionName === "END") {
                subroutineInfo.endLine = inst.lineNumber;
                if (subroutineInfo.startLine >= 0 && subroutineInfo.subroutine !== "") {
                    subroutinesInfo.push(subroutineInfo);
                    subroutineInfo = { subroutine: "", startLine: -1, endLine: -1 };
                }

                // ラベルのスコープが有効ならばEND命令が来るたびにスコープを変える
                if (enableLabelScope) {
                    scope++;
                }
            }

            function updateScopeMap() {
                for (let i = lastScopeSetLine + 1; i < inst.lineNumber; i++) {
                    // 空行などスキップされる行のスコープは-1とする
                    scopeMap.set(i, -1);
                }
                scopeMap.set(inst.lineNumber, scope);
                lastScopeSetLine = inst.lineNumber;
            }

            function registerLabelToLabelMap(inst: InstructionBase) {
                if (inst.label === undefined) throw new Error();

                if (inst.instructionName === "START" && inst.address != undefined) {
                    if (labelMap.has(inst.label, inst.scope)) compileError();
                    else {
                        // START命令でadr指定がある場合はadrから開始することになる
                        const labelToken = inst.originalTokens.label;
                        labelMap.add(inst.label, { address: -1, token: labelToken });
                        labelMap.bindAdd(inst.label, labelToken!, inst.address as string, inst.scope);
                    }
                } else {
                    // COMET2は1語16ビット(2バイト)なので2で割っている
                    const address = byteOffset / 2;
                    const labelToken = inst.originalTokens.label;
                    if (inst.instructionName === "START") {
                        if (labelMap.has(inst.label)) {
                            compileError();
                        }
                        // サブルーチンのラベルにはグローバルにアクセスできるようにする
                        else {
                            labelMap.add(inst.label, { address, token: labelToken });
                        }
                    } else {
                        if (labelMap.has(inst.label, inst.scope)) {
                            compileError();
                        }
                        else {
                            labelMap.add(inst.label, { address, token: labelToken }, inst.scope);
                        }
                    }
                }
            }
        }

        // アドレス解決する
        for (const inst of instructions) {
            const error = inst.resolveAddress(labelMap);
            if (error) {
                diagnostics.push(error);
            }
        }

        checkInstructions();

        return {
            tokensMap: tokensMap,
            subroutinesInfo: subroutinesInfo,
            scopeMap: scopeMap,
            diagnostics: diagnostics,
            instructions: instructions,
            generatedInstructions: generatedInstructions,
            labelMap: labelMap
        }

        // 意味解析をする
        function checkInstructions() {
            for (const inst of instructions) {
                for (const d of inst.check()) {
                    diagnostics.push(d);
                }
            }
        }
    }

    private createDebuggingInfo(instructions: Array<InstructionBase>, labelMap: LabelMap): DebuggingInfo {
        const addressLineMap = new Map<number, number>();
        const subroutineMap = new Map<number, number>();
        let byteOffset = 0;
        for (const inst of instructions) {
            if (inst.lineNumber >= 0 && inst.instructionName !== "END") {
                if (inst.instructionName === "START") {
                    const address = labelMap.get(inst.label as string)!.address;
                    subroutineMap.set(address, inst.lineNumber);
                } else {
                    addressLineMap.set(byteOffset / 2, inst.lineNumber);
                }
            }

            byteOffset += inst.byteLength;
        }

        return {
            addressLineMap: addressLineMap,
            subroutineMap: subroutineMap
        };
    }

    public compile(sourcePath: string, debugging = false): CompileResult {
        const lines = read(sourcePath);
        const { diagnostics, instructions, generatedInstructions, labelMap } = this.analyze(lines);

        const debuggingInfo = debugging ? this.createDebuggingInfo(instructions, labelMap) : undefined;

        const compileSuccess = diagnostics.length == 0;
        if (!compileSuccess) {
            // コンパイル失敗の場合
            return CompileResult.create(false, diagnostics, instructions, labelMap);
        }

        // コンパイル成功の場合
        for (const inst of generatedInstructions) {
            instructions.push(inst);
        }

        const hex = instructions.map(x => x.toHex());
        const flatten = [].concat.apply([], hex) as Array<number>;
        const hexes = flatten.filter(x => x != -1);

        const firstStartInstLabel = instructions[0].label as string;

        const entryPointAddress = labelMap.get(firstStartInstLabel, 1) as LabelInfo;
        // 先頭16バイト分に実行開始番地を埋め込む
        hexes.unshift(entryPointAddress.address, 0, 0, 0, 0, 0, 0, 0);

        return CompileResult.create(true, diagnostics, instructions, labelMap, hexes, debuggingInfo);
    }

    changeCompileOption(option: Casl2CompileOption) {
        this._compileOption = option;
    }
}
