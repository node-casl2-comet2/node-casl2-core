"use strict";

import { InstructionBase } from "./instructions/instructionBase";
import { LabelMap } from "./data/labelMap";
import { Diagnostic } from "./diagnostics/types";

export interface CompileResult {
    success: boolean;
    diagnostics: Array<Diagnostic>;
    instructions: Array<InstructionBase>;
    labelMap: LabelMap;
    hexes?: Array<number>;
    debuggingInfo?: DebuggingInfo;
}

export interface DebuggingInfo {
    /**
     * 実アドレス->行番号のマップ
     */
    addressLineMap: Map<number, number>;

    /**
     * 実アドレス->サブルーチンのSTART命令の行番号のマップ
     */
    subroutineMap: Map<number, number>;
}

export namespace CompileResult {
    export function create(
        success: boolean, diagnostics: Array<Diagnostic>, instructions: Array<InstructionBase>,
        labelMap: LabelMap, hexes?: Array<number>, debuggingInfo?: DebuggingInfo): CompileResult {
        return { success, diagnostics, instructions, labelMap, hexes, debuggingInfo };
    }
}
