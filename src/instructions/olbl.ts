"use strict";

import { InstructionBase } from "./instructionBase";
import { LabelMap } from "../data/labelMap";
import { CompileError } from "../errors/compileError";

/**
 * OLBL命令
 * ラベル名だけ有効な空命令(バイト長は0)
 */
export class OLBL extends InstructionBase {
    constructor(label: string | undefined) {
        super("OLBL", undefined, label);
    }
}
