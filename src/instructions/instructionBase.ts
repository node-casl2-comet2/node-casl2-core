"use strict";

import { GR } from "@maxfield/node-casl2-comet2-core-common";
import { LabelMap } from "../data/labelMap";
import { Diagnostic } from "../diagnostics/types";
import { createDiagnostic } from "../diagnostics/diagnosticMessage";
import { Diagnostics } from "../diagnostics/diagnosticMessages";
import { TokenInfo } from "../casl2/lexer/token";

export class InstructionBase implements Instruction {
    private _instructionName: string;
    private _lineNumber: number;
    protected _isConfirmed: boolean;
    private _r1: GR | undefined;
    private _r2: GR | undefined;
    private _address: number | string | undefined;
    private _label: string | undefined;
    private _code: number;
    private _byteLength: number;
    private _scope: number;

    constructor(
        instructionName: string,
        lineNumber: number,
        code: number,
        label?: string | undefined,
        r1?: GR | undefined,
        r2?: GR | undefined,
        address?: number | string | undefined) {
        this._instructionName = instructionName;
        this._lineNumber = lineNumber;
        this._code = code;
        this._label = label;
        this._r1 = r1;
        this._r2 = r2;

        if (address !== undefined) {
            this._address = address;
            // アドレスが数字なら確定してよい
            if (typeof address == "number") {
                this._isConfirmed = true;
            } else {
                this._isConfirmed = false;
            }
        } else {
            // アドレスが無いなら確定してよい
            this._isConfirmed = true;
        }

        this._byteLength = code != -1 ? InstructionBase.byteLengthMap.get(code)! : 0;
    }

    public get instructionName() {
        return this._instructionName;
    }

    protected get code() {
        return this._code;
    }

    public setAddress(address: number) {
        this._address = address;
    }

    public setLabel(label: string) {
        this._label = label;
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

    public toHex(): Array<number> {
        if (!this._isConfirmed) throw new Error("Not confirmed instruction.");

        // .comファイルに還元されない命令は空配列を返す
        if (this._code === -1) return [];

        let hex = this._code;

        // 16進数で2桁左にずらす
        hex = hex << 0x08;
        // r1とr2はundefinedかもしれない
        const gr = ((this._r1 || 0) << 0x04) | (this._r2 || 0);
        hex = hex | gr;

        if (this._address != undefined) {
            let address = this._address as number;

            if (address < 0) {
                address = 0xFFFF - (Math.abs(address) - 1);
            }

            return [hex, address];
        } else {
            return [hex];
        }
    }

    /**
     * ラベルマップを使ってラベルを実際のアドレスに解決します
     */
    public resolveAddress(labelMap: LabelMap): Diagnostic | undefined {
        if (this._isConfirmed) return undefined;

        const adr = this._address as string;
        const resolvedAddress = labelMap.get(adr, this.scope);
        if (resolvedAddress == undefined) {
            return createDiagnostic(this.lineNumber!, 0, 0, Diagnostics.Undeclared_label_0_, adr);
        }

        this._address = resolvedAddress;
        this._isConfirmed = true;

        return undefined;
    }

    public get label() {
        return this._label;
    }

    public get scopedLabel() {
        return `${this.scope}-${this.label}`;
    }

    public get address() {
        return this._address;
    }

    public get scope() {
        return this._scope || 1;
    }

    /**
     * 命令のバイト長
     */
    public get byteLength() {
        return this._byteLength;
    }

    /**
     * 命令の行番号
     */
    public get lineNumber() {
        return this._lineNumber;
    }

    public getLiteral(): number | string | undefined {
        if (this._address == undefined) return undefined;
        if (typeof this._address != "string") return undefined;

        // アドレスの一文字目が'='でないならばリテラルではない
        if (this._address.charAt(0) != "=") return undefined;

        // '='を除いたものを得る
        const str = this._address.slice(1);

        // 10進定数か?
        const decimal = parseInt(str, 10);
        if (!isNaN(decimal)) return decimal;

        // 16進定数か?
        if (str.charAt(0) == "#") {
            const hex = parseInt(str.slice(1), 16);
            if (!isNaN(hex)) return hex;
        }

        // 文字列か?
        if (str.length > 2 &&
            str.charAt(0) == "'" && str.charAt(str.length - 1) == "'") return str;

        // リテラルならば必ず10進定数か16進定数か文字定数のはず
        throw new Error();
    }

    public replaceLiteralWithLabel(label: string) {
        this._address = label;
    }

    /**
     * この命令が属する命令ブロックを設定する
     */
    public setScope(scope: number) {
        this._scope = scope;
    }

    public check(): Array<Diagnostic> {
        const diagnostics: Array<Diagnostic> = [];
        if (this._label !== undefined) {
            const l = this._label;
            // ラベルの長さをチェック
            if (l.length > 8) {
                diagnostics.push(createDiagnostic(this._lineNumber, 0, 0, Diagnostics.Too_long_label_name));
            }
        }

        return diagnostics;
    }

    // 参考URL: http://www.officedaytime.com/dcasl2/pguide/qref.html
    private static byteLengthMap = new Map<number, number>([
        [0x14, 2],
        [0x10, 4],
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

export interface Instruction {
    resolveAddress(labelMap: LabelMap): Diagnostic | undefined;
}
