'use strict';
import { GR } from '../comet2/gr';
import { CompileError } from '../errors/compileError';
import { InvalidInstructionError, InvalidLabelError } from '../errors/errors';

export class Lexer {
    public static tokenize(line: string, lineNumber: number): LexerResult | CompileError {
        let label = "";
        let instruction = "";
        let r1 = GR.GR1;
        let r2 = GR.GR2;
        let address: number | string = 123;
        let comment = null;

        let str = line;
        let semicolonIndex = line.indexOf(';');
        if (semicolonIndex >= 0) {
            comment = line.slice(semicolonIndex);
            str = line.substring(0, semicolonIndex);
        }

        let split = str.split(/\s+|,\s+/);
        let index = 0;
        let first = split[index];
        if (Lexer.isInstruction(first)) {
            // 1つ目のトークンが命令の場合
            instruction = first;
            index++;
        } else {
            // 1つ目のトークンがラベルの場合            
            // 正常なラベルか?
            if (Lexer.isGR(first)) return new InvalidLabelError(lineNumber);

            // 空白かもしれない
            if (first == "") return new InvalidLabelError(lineNumber);

            label = first;

            index++;
            let inst = split[index];
            if (!Lexer.isInstruction(inst)) return new InvalidInstructionError(lineNumber);

            instruction = inst;

            index++;
        }


        let toGR = (gr: string) => {
            if (gr == "GR0") return GR.GR0;
            if (gr == "GR1") return GR.GR1;
            if (gr == "GR2") return GR.GR2;
            if (gr == "GR3") return GR.GR3;
            if (gr == "GR4") return GR.GR4;
            if (gr == "GR5") return GR.GR5;
            if (gr == "GR6") return GR.GR6;
            if (gr == "GR7") return GR.GR7;
        };
        // 命令の後の1つ目のトークンはレジスタまたはアドレス
        let arg1 = split[index];
        console.log("ARG1: " + arg1);
        if (Lexer.isGR(arg1)) {
            r1 = toGR(arg1);
        } else if (Lexer.toAddress(arg1)) {

        }

        // 命令の後の2つ目のトークンはレジスタまたはアドレス

        // 命令の後の3つ目のトークンは指標レジスタのみ


        console.log(split);

        return new LexerResult(label, instruction, r1, r2, address, comment);
    }

    private static isLabel(str: string): boolean {
        // 1文字目が大文字で2文字目以降は大文字または数字である
        let regex = /[A-Z][A-Z0-9]*/;
        let result = str.match(regex);
        return result != null;
    }

    private static isInstruction(str: string): boolean {
        // TODO: 行頭と行末のチェックを入れる
        let regex = /START|LAD|ADDA|RET|END/;
        let result = str.match(regex);
        return result != null;
    }

    private static isGR(str: string): boolean {
        let regex = /GR0|GR1|GR2|GR3|GR4|GR5|GR6|GR7/;
        let result = str.match(regex);
        return result != null;
    }

    // TODO: booleanではなく直接値を返すように変更
    private static toAddress(str: string): boolean {
        // アドレスはラベル名で指定されるかも
        if (Lexer.isLabel(str)) return true;

        // アドレスはリテラルかも
        // 1文字目と末尾の文字がシングルクォーテーションである
        if (str.charAt(0) == '\'' && str.charAt(str.length - 1) == '\'') return true;

        // アドレスは16進数かも
        // 16進定数は#で始まる数字の連続である
        if (str.charAt(0) == '#') {
            let address = parseInt(str.slice(1), 16);
            if (isNaN(address)) return false;
        }

        // アドレスは10進数かも
        // マイナスはあり得ない
        if (str.charAt(0) == '-') return false;
        // 10進数と解釈して変換する
        // 変換に失敗するとNaNが返る
        let address = parseInt(str, 10);
        if (isNaN(address)) {
            return false;
        } else {
            return true;
        }
    }
}


export class LexerResult {
    private _label: string;
    private _instruction: string;
    private _r1: GR;
    private _r2: GR;
    private _address: number;
    private _comment;

    constructor(label: string, instruction: string, r1: GR, r2: GR, address: number, comment?: string) {
        this._label = label;
        this._instruction = instruction;
        this._r1 = r1;
        this._r2 = r2;
        this._address = address;
        this._comment = comment;
    }

    public get label() {
        return this._label;
    }

    public get instruction() {
        return this._instruction;
    }

    public get r1() {
        return this._r1;
    }

    public get r2() {
        return this._r2;
    }

    public get address() {
        return this._address;
    }
}
