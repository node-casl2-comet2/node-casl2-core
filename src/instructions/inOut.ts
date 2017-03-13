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

    public resolveAddress(labelMap: LabelMap): Diagnostic | undefined {
        if (this._isConfirmed) return undefined;

        if (typeof this.address != "number") {
            const adr = this.address as string;
            const resolvedAddress = labelMap.get(adr, this.scope);
            if (resolvedAddress == undefined) {
                const [s, e] = this.getTokenIndex(this._originalTokens.buf);
                return createDiagnostic(this.lineNumber, s, e, Diagnostics.Undeclared_label_0_, adr);
            }
            this.setAddress(resolvedAddress.address);
        }
        if (typeof this._lengthAddress != "number") {
            const adr = this._lengthAddress;
            const resolvedAddress = labelMap.get(adr, this.scope);
            if (resolvedAddress == undefined) {
                const [s, e] = this.getTokenIndex(this._originalTokens.length);
                return createDiagnostic(this.lineNumber, s, e, Diagnostics.Undeclared_label_0_, adr);
            }
            this._lengthAddress = resolvedAddress.address;
        }

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
