"use strict";

import { INOUT } from "./inOut";

export class IN extends INOUT {
    constructor(label: string | undefined, inAddress: number | string, inLengthAddress: number | string) {
        super("IN", 0x90, label, undefined, undefined, inAddress);
        this._lengthAddress = inLengthAddress;
    }
}
