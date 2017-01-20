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
    private _byteLength: number;

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
            }else{
                this._isConfirmed = false;
            }
        } else {
            // アドレスが無いなら確定してよい
            this._isConfirmed = true;
        }

        this._byteLength = code ? InstructionBase.byteLengthMap.get(code)! : 0;
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
        this._isConfirmed = true;
    }

    public get label() {
        return this._label;
    }

    /**
     * 命令のバイト長
     */
    public get byteLength(){
        return this._byteLength;
    }

    /**
     * 命令の行番号
     */
    public get lineNumber(){
        return this._lineNumber;
    }

    private static byteLengthMap = new Map<number, number>([
        // TODO: コメントに対応を書く
        [0x14, 2],  // LD r1, r2
        [0x10, 4],  // LD r, adr[, x]
        [0x11, 4],
        [0x12, 4],
        [0x24, 2],
        [0x20, 4],
        [0x26, 2],
        [0x22, 4],
        [0x25, 2],
        [0x21, 4],
        [0x27, 2],
        [0x23, 4],
        [0x34, 2],
        [0x30, 4],
        [0x35, 2],
        [0x31, 4],
        [0x36, 2],
        [0x32, 4],
        [0x44, 2],
        [0x40, 4],
        [0x45, 2],
        [0x41, 4],
        [0x50, 4],
        [0x51, 4],
        [0x52, 4],
        [0x53, 4],
        [0x65, 4],
        [0x61, 4],
        [0x62, 4],
        [0x63, 4],
        [0x66, 4],
        [0x64, 4],
        [0x70, 4],
        [0x71, 2],
        [0x80, 4],
        [0x81, 2],
        [0xF0, 4],
        [0x00, 2]
    ]);
}