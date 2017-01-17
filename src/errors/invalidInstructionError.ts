'use strict';

import { CompileError } from './compileError';

export class InvalidInstructionError extends CompileError {
    constructor(lineNumber: number) {
        // 命令セットにない不正な命令である
        let message = "Invalid instruction.";
        super(message, lineNumber);
    }
}
