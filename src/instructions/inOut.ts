"use strict";

import { InstructionBase } from "./instructionBase";
import { LabelMap } from "../data/labelMap";
import { CompileError } from "../errors/compileError";

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

    public resolveAddress(labelMap: LabelMap): CompileError | undefined {
        if (this.isConfirmed) return undefined;

        if (typeof this.address != "number") {
            const adr = this.address as string;
            const resolvedAddress = labelMap.get(adr, this.block);
            if (resolvedAddress == undefined) return new CompileError(this.lineNumber, "undeclared label: " + adr);
            this.setAddress(resolvedAddress);
        }
        if (typeof this._lengthAddress != "number") {
            const adr = this._lengthAddress;
            const resolvedAddress = labelMap.get(adr, this.block);
            if (resolvedAddress == undefined) return new CompileError(this.lineNumber, "undeclared label: " + adr);
            this._lengthAddress = resolvedAddress;
        }

        return undefined;
    }

    private get isConfirmed() {
        return typeof this.address == "number" && typeof this._lengthAddress == "number";
    }
}
