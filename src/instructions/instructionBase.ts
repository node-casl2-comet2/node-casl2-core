'use strict';

import { GR } from '../comet2/gr';
import { LabelMap } from '../data/labelMap';

export class InstructionBase {
    private _lineNumber: number;
    private _instructionName: string;
    private _isConfirmed: boolean;
    private _r1: GR | undefined;
    private _r2: GR | undefined;
    private _address: number | string | undefined;
    private _label: string | undefined;
    private _code: number | undefined;

    constructor(
        instructionName: string,
        code: number | undefined,
        label?: string | undefined,
        r1?: GR | undefined,
        r2?: GR | undefined,
        address?: number | string | undefined) {
        this._instructionName = instructionName;
        this._code = code;
        this._label = label;
        this._r1 = r1;
        this._r2 = r2;

        if (address) {
            this._address = address;
            // アドレスが数字なら確定してよい
            if (typeof address == "number") {
                this._isConfirmed = true;
            }
        } else {
            // アドレスが無いなら確定してよい
            this._isConfirmed = true;
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

    public toHex(): number {
        if (!this._isConfirmed) throw new Error("Not confirmed instruction.");

        // .comファイルに還元されない命令は-1を返す
        if (this._code == undefined) return -1;

        let hex = this._code;

        // 16進数で2桁左にずらす
        hex = hex << 0x08;
        // r1とr2はundefinedかもしれない
        let gr = ((this._r1 || 0) << 0x04) | (this._r2 || 0);
        hex = hex | gr;

        if (this._address) {
            // 16進数で4桁左にずらす
            // TODO: シフト演算を使うと32ビット扱いになってオーバーフローしてしまう
            //       シフト演算でうまくやる方法はないか?
            hex = hex * 65536 + (this._address as number);
        }

        return hex;
    }

    public resolveAddress(labelMap: LabelMap) {
        if (this._isConfirmed) return;

        this._address = labelMap.get(this._address as string);
    }
}