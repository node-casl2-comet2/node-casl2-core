'use strict';

import { CompileError } from './compileError';

export class InvalidLabelError extends CompileError {
    constructor(lineNumber: number) {
        // 不正なラベルのエラー
        let message = "Invalid label.";
        super(message, lineNumber);
    }
}
