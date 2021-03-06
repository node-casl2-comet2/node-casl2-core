"use strict";

import { InstructionBase } from "./instructionBase";

/**
 * OLBL命令
 * ラベル名だけ有効な空命令(バイト長は0)
 */
export class OLBL extends InstructionBase {
    constructor(lineNumber: number, label: string | undefined) {
        super("OLBL", lineNumber, -1, label);
    }
}
