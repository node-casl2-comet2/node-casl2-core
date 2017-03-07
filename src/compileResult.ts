"use strict";

import { InstructionBase } from "./instructions/instructionBase";
import { LabelMap } from "./data/labelMap";
import { Diagnostic } from "./diagnostics/types";

export class CompileResult {
    constructor(
        private _diagnostics: Array<Diagnostic>,
        private _instructions: Array<InstructionBase>,
        private _labelMap?: LabelMap,
        private _hexes?: Array<number>) {
    }

    public get instructions() {
        return this._instructions;
    }

    public get hexes() {
        return this._hexes;
    }

    public get errors() {
        return this._diagnostics;
    }

    public get success() {
        return this._diagnostics.length == 0;
    }

    public get labelMap() {
        return this._labelMap;
    }
}
