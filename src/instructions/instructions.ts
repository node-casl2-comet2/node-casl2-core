'use strict';

import { InstructionBase } from './instructionBase';
import { GR } from '../comet2/gr';
import { LexerResult } from '../casl2/lexer';

export class Instructions {
    /**
     * START命令
     */
    public static start(label?: string) {
        return new InstructionBase("START", null, label);
    }

    /**
     * RET命令
     */
    public static ret(label?: string) {
        return new InstructionBase("RET", 0x81, label);
    }

    /**
     * END命令
     */
    public static end() {
        return new InstructionBase("END", null);
    }

    /**
     * LAD命令
     */
    public static lad(label: string, r: GR, adr: number | string, x?: GR) {
        return new InstructionBase("LAD", 0x12, label, r, x, adr);
    }

    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, r2: GR): InstructionBase;
    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, adr: number | string, x?: GR): InstructionBase;
    public static adda(label: string, x1: any, x2: any, x3?: any): InstructionBase {
        if (typeof x2 == "GR") {
            // アドレス無し
            return new InstructionBase("ADDA", 0x24, label, x1, x2).confirmed();
        } else {
            // アドレス有り
            return new InstructionBase("ADDA", 0x20, label, x1, x3, x2);
        }
    }

    public static create(result: LexerResult): InstructionBase {
        // 正規表現で引数のパターンによって命令を分類
        // 命令と命令コードの対応はディクショナリなりで作る
        // .comファイルに還元されない命令

        // TODO: IN | OUT の分類を決める
        // 引数を取らない命令
        let type1InstRegex = /\bEND|RPUSH|RPOP\b/;
        // 引数にr1, r2またはr, adr[, x]を取る命令
        let type2InstRegex = /\bLD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL\b/;
        // 引数にr, adr[, x]を取る命令
        let type3InstRegex = /\b\b/;
        let type4InstRegex = /\b\b/;
        // adrを引数に取る命令
        let type5InstRegex = /\bSTART\b/;
        // 数値を引数に取る命令
        let type6InstRegex = /\bDS\b/;
        // 定数列を引数に取る命令
        let type7InstRegex = /\bDC\b/;
        return new InstructionBase(result.instruction, 0x00, result.label, result.r1, result.r2, result.address);
    }
}
