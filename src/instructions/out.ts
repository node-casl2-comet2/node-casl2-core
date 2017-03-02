"use strict";

import { INOUT } from "./inOut";

export class OUT extends INOUT {
    constructor(lineNumber: number, label: string | undefined, outAddress: number | string, outLengthAddress: number | string) {
        super("OUT", lineNumber, 0x91, label, undefined, undefined, outAddress);
        this._lengthAddress = outLengthAddress;
    }
}
