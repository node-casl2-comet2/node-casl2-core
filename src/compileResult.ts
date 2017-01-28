'use strict';

import { CompileError } from './errors/compileError';
import { InstructionBase } from './instructions/instructionBase';
import { LabelMap } from './data/labelMap';

export class CompileResult {
    private _errors: Array<CompileError>;
    private _instructions: Array<InstructionBase>;
    private _success: boolean;
    private _labelMap: LabelMap;

    constructor(instructions: Array<InstructionBase>, errors: Array<CompileError>, labelMap: LabelMap) {
        this._instructions = instructions;
        this._errors = errors;
        this._labelMap = labelMap;

        this._success = errors.length == 0;
    }

    public get instructions() {
        return this._instructions;
    }

    public get errors() {
        return this._errors;
    }

    public get success() {
        return this._success;
    }

    public get labelMap() {
        return this._labelMap;
    }
}