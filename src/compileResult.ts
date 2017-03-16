"use strict";

import { InstructionBase } from "./instructions/instructionBase";
import { LabelMap } from "./data/labelMap";
import { Diagnostic } from "./diagnostics/types";

export interface CompileResult {
    success: boolean;
    diagnostics: Array<Diagnostic>;
    instructions: Array<InstructionBase>;
    labelMap?: LabelMap;
    hexes?: Array<number>;
}

export namespace CompileResult {
    export function create(success: boolean, diagnostics: Array<Diagnostic>, instructions: Array<InstructionBase>, labelMap?: LabelMap, hexes?: Array<number>): CompileResult {
        return { success, diagnostics, instructions, labelMap, hexes };
    }
}
