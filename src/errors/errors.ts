"use strict";

import { CompileError } from "./compileError";

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
                super(lineNumber, message, errorCode);
            } else {
                super(lineNumber, message, 0x1000);
            }
        } else {
            // 引数エラーの規定のエラーコードは0x1000
            super(lineNumber, "Argument error.", 0x1000);
        }
    }
}

export class IndexRegisterError extends CompileError {
    constructor(lineNumber: number) {
        // GR0は指標レジスタに使えない
        const message = "GR0 cannot be used for index register.";
        super(lineNumber, message);
    }
}

export class InvalidInstructionError extends CompileError {
    constructor(lineNumber: number) {
        // 命令セットにない不正な命令である
        const message = "Invalid instruction.";
        super(lineNumber, message);
    }
}

export class InvalidLabelError extends CompileError {
    constructor(lineNumber: number) {
        // 不正なラベルのエラー
        const message = "Invalid label.";
        super(lineNumber, message);
    }
}
