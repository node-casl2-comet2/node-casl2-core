"use strict";

import { InstructionBase } from "./instructionBase";

export class MDC extends InstructionBase {
    private _charLiteral: string | undefined;

    constructor(label: string | undefined, address?: number | string, charLiteral?: string) {
        super("MDC", undefined, label, undefined, undefined, address);
        this._charLiteral = charLiteral;
    }

    public toHex(): Array<number> {
        if (this._charLiteral) {
            if (this._charLiteral.length != 1) throw new Error();

            const asciiCode = this._charLiteral.charCodeAt(0);
            const hex = asciiCode;
            return [hex];
        } else {
            const hex = this.address as number;
            return [hex];
        }
    }

    public get byteLength() {
        return 2;
    }
}
