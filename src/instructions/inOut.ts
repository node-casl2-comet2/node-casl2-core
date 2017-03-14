"use strict";

import { InstructionBase } from "./instructionBase";
import { LabelMap } from "../data/labelMap";
import { Diagnostic } from "../diagnostics/types";
import { createDiagnostic } from "../diagnostics/diagnosticMessage";
import { Diagnostics } from "../diagnostics/diagnosticMessages";
import { OriginalTokens } from "./instructionBase";
import { TokenInfo } from "../casl2/lexer/token";

export class INOUT extends InstructionBase {
    protected _lengthAddress: number | string;

    public toHex(): number[] {
        const hex: Array<number> = [];
        hex.push((this.code as number) << 0x08);
        hex.push(this.address as number);
        hex.push(this._lengthAddress as number);

        return hex;
    }

    public get byteLength() {
        return 6;
    }

    setLengthAddress(address: number) {
        this._lengthAddress = address;
    }

    public resolveAddress(labelMap: LabelMap): Diagnostic | undefined {
        if (this._isConfirmed) return undefined;

        if (typeof this.address != "number") {
            const r1 = this.resolve(labelMap, this.address as string, this._originalTokens.buf, this.setAddress.bind(this));
            if (r1 !== undefined) return r1;
        }
        if (typeof this._lengthAddress != "number") {
            const r2 = this.resolve(labelMap, this._lengthAddress, this._originalTokens.length, this.setLengthAddress.bind(this));
            if (r2 !== undefined) return r2;
        }

        // 命令を確定させる
        this.confirmed();

        return undefined;
    }
}

export class IN extends INOUT {
    constructor(lineNumber: number, label: string | undefined, inAddress: number | string, inLengthAddress: number | string) {
        super("IN", lineNumber, 0x90, label, undefined, undefined, inAddress);
        this._lengthAddress = inLengthAddress;

        this._isConfirmed = this.address == "number" && typeof this._lengthAddress == "number";
    }
}

export class OUT extends INOUT {
    constructor(lineNumber: number, label: string | undefined, outAddress: number | string, outLengthAddress: number | string) {
        super("OUT", lineNumber, 0x91, label, undefined, undefined, outAddress);
        this._lengthAddress = outLengthAddress;

        this._isConfirmed = this.address == "number" && typeof this._lengthAddress == "number";
    }
}
