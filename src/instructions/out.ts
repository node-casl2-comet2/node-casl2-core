"use strict";

import { INOUT } from "./inOut";

export class OUT extends INOUT {
    constructor(label: string | undefined, outAddress: number | string, outLengthAddress: number | string) {
        super("OUT", 0x91, label, undefined, undefined, outAddress);
        this._lengthAddress = outLengthAddress;
    }
}
