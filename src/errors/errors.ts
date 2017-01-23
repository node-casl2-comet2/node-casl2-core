'use strict';

import { CompileError } from './compileError';

export class Errors {
    /**
     * 文字列定数のエラー
     */
    public static stringConstantError(lineNumber: number) {
        return new ArgumentError(lineNumber, "String constant error.", 0x0000);
    }
}

export class ArgumentError extends CompileError {
    constructor(lineNumber: number, message?: string, errorCode?: number) {
        // 引数の数が合わないなどのエラー
        if (message) {
            if (errorCode) {
                super(message, lineNumber, errorCode);
            } else {
                super(message, lineNumber, 0x1000);
            }
        } else {
            // 引数エラーの規定のエラーコードは0x1000
            super("Argument error.", lineNumber, 0x1000);
        }
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
