"use strict";

import { DiagnosticCategory } from "./types";

export const Diagnostics = {
    Duplicate_label_0_: {
        code: 1,
        category: DiagnosticCategory.Error,
        message: "ラベル '{0}' が重複しています。。"
    },
    GR0_cannot_be_used_as_index_register: {
        code: 2,
        category: DiagnosticCategory.Error,
        message: "GR0は指標レジスタとして使用できません。"
    },
    Invalid_instruction_0_: {
        code: 3,
        category: DiagnosticCategory.Error,
        message: "'{0}' は不正な命令です。"
    },
    Invalid_label_0_: {
        code: 4,
        category: DiagnosticCategory.Error,
        message: "'{0}' は不正なラベルです。"
    },
    Invalid_instruction_line: {
        code: 5,
        category: DiagnosticCategory.Error,
        message: "不正な命令行です。"
    },
    _0_cannot_be_used_for_label_name: {
        code: 6,
        category: DiagnosticCategory.Error,
        message: "'{0}' はラベル名に使用できません。"
    },
    Missing_arguments: {
        code: 7,
        category: DiagnosticCategory.Error,
        message: "引数が不足しています。"
    },
    _0_expected: {
        code: 8,
        category: DiagnosticCategory.Error,
        message: "{0} が必要です。"
    },
    _0_needed: {
        code: 9,
        category: DiagnosticCategory.Error,
        message: "{0} である必要があります。"
    },
    Instruction_0_arguments_count_should_be_1_: {
        code: 10,
        category: DiagnosticCategory.Error,
        message: "命令 '{0}' のオペランドの数は {1} である必要があります。"
    },
    Invalid_address_0_: {
        code: 11,
        category: DiagnosticCategory.Error,
        message: "{0} はアドレスに使用できません。"
    },
    Invalid_GR_0_: {
        code: 12,
        category: DiagnosticCategory.Error,
        message: "{0} はGRではありません。"
    },
    Word_count_should_be_given_by_decimal: {
        code: 13,
        category: DiagnosticCategory.Error,
        message: "{0} はGRではありません。"
    },
    Cannot_escape_single_quotes: {
        code: 14,
        category: DiagnosticCategory.Error,
        message: "シングルクォーテーションをエスケープできません。"
    },
    JIS_X_0201_out_of_range: {
        code: 15,
        category: DiagnosticCategory.Error,
        message: "文字列定数にJIS X 0201で表現出来ない文字が含まれています"
    },
    Undeclared_label_0_: {
        code: 16,
        category: DiagnosticCategory.Error,
        message: "ラベル '{0}' は存在しません。"
    }
}
