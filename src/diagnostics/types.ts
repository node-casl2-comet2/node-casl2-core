"use strict";

export enum DiagnosticCategory {
    Warning,
    Error,
    Message,
}

export interface DiagnosticMessage {
    category: DiagnosticCategory;
    code: number;
    message: string;
}

export interface Diagnostic {
    filePath?: string;
    line: number;
    startIndex: number;
    endIndex: number;
    messageText: string;
    category: DiagnosticCategory;
    code: number;
}
