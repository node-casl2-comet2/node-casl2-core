"use strict";

import { DiagnosticCategory } from "./types";

export const Diagnostics = {
    Duplicate_label_0_: {
        code: 1,
        category: DiagnosticCategory.Error,
        message: "ラベル '{0}' が重複しています。"
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
    Too_long_label_name: {
        code: 4,
        category: DiagnosticCategory.Error,
        message: "ラベルは8文字以内である必要があります。"
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
    },
    Missing_instruction: {
        code: 17,
        category: DiagnosticCategory.Error,
        message: "命令がありません。"
    },
    Missing_address: {
        code: 18,
        category: DiagnosticCategory.Error,
        message: "アドレス 'adr' がありません。"
    },
    Unnecessary_operand: {
        code: 20,
        category: DiagnosticCategory.Message,
        message: "余計なオペランドです。"
    },
    Missing_GR_r1: {
        code: 21,
        category: DiagnosticCategory.Error,
        message: "GR 'r1' がありません。"
    },
    Missing_GR_r2: {
        code: 22,
        category: DiagnosticCategory.Error,
        message: "GR 'r2' がありません。"
    },
    Missing_r: {
        code: 23,
        category: DiagnosticCategory.Error,
        message: "GR 'r' がありません。"
    },
    Missing_input_buf: {
        code: 24,
        category: DiagnosticCategory.Error,
        message: "アドレス '入力領域' がありません。"
    },
    Missing_input_length_buf: {
        code: 25,
        category: DiagnosticCategory.Error,
        message: "アドレス '入力文字長領域' がありません。"
    },
    Missing_output_buf: {
        code: 26,
        category: DiagnosticCategory.Error,
        message: "アドレス '出力領域' がありません。"
    },
    Missing_output_length_buf: {
        code: 27,
        category: DiagnosticCategory.Error,
        message: "アドレス '出力文字長領域' がありません。"
    },
    Missing_word_count: {
        code: 28,
        category: DiagnosticCategory.Error,
        message: "10進定数 '語数' がありません。"
    },
    Missing_constans: {
        code: 29,
        category: DiagnosticCategory.Error,
        message: "'定数[, 定数]' がありません。"
    }
}
