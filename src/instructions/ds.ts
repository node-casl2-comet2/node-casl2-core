"use strcit";

import * as _ from "lodash";
import { InstructionBase } from "./instructionBase";

export class DS extends InstructionBase {
    constructor(lineNumber: number, private _wordCount: number, label?: string) {
        super("DS", lineNumber, -1, label);
    }

    public get byteLength(): number {
        return 2 * this._wordCount;
    }

    public toHex(): number[] {
        return _.times(this._wordCount).map(_ => 0x0000);
    }
}
