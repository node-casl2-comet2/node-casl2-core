'use strict';

import { CompileError } from './compileError';

export class ArgumentError extends CompileError {
    constructor(lineNumber: number) {
        // 引数の数が合わないなどのエラー
        let message = "Argument error.";
        super(message, lineNumber);
    }
}
