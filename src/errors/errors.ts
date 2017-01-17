'use strict';

import { CompileError } from './compileError';

export class ArgumentError extends CompileError {
    constructor(lineNumber: number) {
        // 引数の数が合わないなどのエラー
        let message = "Argument error.";
        super(message, lineNumber);
    }
}

export class IndexRegisterError extends CompileError {
    constructor(lineNumber: number) {
        // GR0は指標レジスタに使えない
        let message = "GR0 cannot be used for index register.";
        super(message, lineNumber);
    }
}

export class InvalidInstructionError extends CompileError {
    constructor(lineNumber: number) {
        // 命令セットにない不正な命令である
        let message = "Invalid instruction.";
        super(message, lineNumber);
    }
}

export class InvalidLabelError extends CompileError {
    constructor(lineNumber: number) {
        // 不正なラベルのエラー
        let message = "Invalid label.";
        super(message, lineNumber);
    }
}
