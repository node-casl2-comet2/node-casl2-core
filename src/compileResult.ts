"use strict";

import { CompileError } from "./errors/compileError";
import { InstructionBase } from "./instructions/instructionBase";
import { LabelMap } from "./data/labelMap";

export class CompileResult {
    constructor(
        private _instructions: Array<InstructionBase>,
        private _hexes: Array<number>,
        private _errors: Array<CompileError>,
        private _labelMap: LabelMap) {
    }

    public get instructions() {
        return this._instructions;
    }

    public get hexes() {
        return this._hexes;
    }

    public get errors() {
        return this._errors;
    }

    public get success() {
        return this._errors.length == 0;
    }

    public get labelMap() {
        return this._labelMap;
    }
}
