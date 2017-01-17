'use strict';

import { GR } from '../comet2/gr';

export class InstructionBase {
    private _lineNumber: number;
    private _instructionName: string;
    private _isConfirmed: boolean;
    private _r1: GR;
    private _r2: GR;
    private _address: number;
    private _label: string;
    private _code: number;

    constructor(instructionName: string, code?: number, label?: string, r1?: GR, r2?: GR, address?: number) {
        this._instructionName = instructionName;
        this._code = code;
        this._label = label;
        this._r1 = r1;
        this._r2 = r2;

        // アドレスが分かっているなら確定してよい
        if (address) {
            this._address = address;
            this._isConfirmed = true;
        } else {
            this._isConfirmed = false;
        }
    }

    public get instructionName() {
        return this._instructionName;
    }

    public setAddress(address: number) {
        this._address = address;
    }

    /**
     * 命令を確定させる
     */
    public confirmed() {
        this._isConfirmed = true;
        return this;
    }

    public toString() {
        return [this._label, this._instructionName, this._r1, this._r2, this._address].join("   ");
    }
}