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
            const resolvedAddress = labelMap.get(this.address as string);
            if (resolvedAddress == undefined) return new CompileError(this.lineNumber, "undeclared label: " + this.address as string);
            this.setAddress(resolvedAddress);
        }
        if (typeof this._lengthAddress != "number") {
            const resolvedAddress = labelMap.get(this._lengthAddress as string);
            if (resolvedAddress == undefined) return new CompileError(this.lineNumber, "undeclared label: " + this.address as string);
            this._lengthAddress = resolvedAddress;
        }

        return undefined;
    }

    private get isConfirmed() {
        return typeof this.address == "number" && typeof this._lengthAddress == "number";
    }
}
