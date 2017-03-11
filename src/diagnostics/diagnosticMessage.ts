"use strict";

import { DiagnosticCategory, DiagnosticMessage, Diagnostic } from "./types";

export function createDiagnostic(line: number, startIndex: number, endIndex: number, message: DiagnosticMessage, ...args: Array<string | number>): Diagnostic {
    let m = message.message;
    if (arguments.length > 3) {
        m = formatMessage(m, args);
    }

    return {
        line: line,
        startIndex: startIndex,
        endIndex: endIndex,
        messageText: m,
        category: message.category,
        code: message.code
    };
}

// e.g. "Duplicate label '{0}'." -> "Duplicate label 'L1'."
export function formatMessage(s: string, args: { [index: number]: string | number }): string {
    const format = s.replace(/{(\d+)}/g, (match, index) => args[index].toString());

    return format;
}
