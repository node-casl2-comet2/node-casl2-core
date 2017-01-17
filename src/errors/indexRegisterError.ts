'use strict';

import { CompileError } from './compileError';

export class IndexRegisterError extends CompileError {
    constructor(lineNumber: number) {
        // GR0は指標レジスタに使えない
        let message = "GR0 cannot be used for index register.";
        super(message, lineNumber);
    }
}
