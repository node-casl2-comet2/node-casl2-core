'use strict';
import { GR } from '../comet2/gr';
import { CompileError } from '../errors/compileError';
import { InvalidLabelError } from '../errors/invalidLabelError';

export class Lexer {
    public static tokenize(line: string): LexerResult | CompileError {
        let label = "";
        let instruction = "";
        let r1 = GR.GR1;
        let r2 = GR.GR2;
        let address = 123;
        let comment = null;

        let str = line;
        let semicolonIndex = line.indexOf(';');
        if (semicolonIndex >= 0) {
            comment = line.slice(semicolonIndex);
            str = line.substring(0, semicolonIndex);
        }

        let split = str.split(/\s+|,\s+/);
        let first = split[0];
        if (Lexer.isInstruction(first)) {
            // 一つ目が命令の場合
            instruction = first;
        } else {
            // 一つ目は正常なラベルか?
            // TODO: 行番号を引数に取るようにする
            if (Lexer.isGR(first)) return new InvalidLabelError(3);

            // 空白かもしれない
        }
        console.log(split);

        return new LexerResult(label, instruction, r1, r2, address, comment);
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
