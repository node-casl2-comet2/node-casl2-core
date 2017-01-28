'use strict';
import { GR } from '../comet2/gr';
import { CompileError } from '../errors/compileError';
import { InvalidInstructionError, InvalidLabelError, ArgumentError } from '../errors/errors';

export class Lexer {
    public static tokenize(line: string, lineNumber: number): LexerResult | CompileError {
        let label: string | undefined;
        let instruction: string | undefined;
        let r1: GR | undefined;
        let r2: GR | undefined;
        let address: number | string | undefined;
        let comment: string | undefined;
        let wordCount: number | undefined;
        let consts: Array<number | string> | undefined;
        let outLengthAddress: number | string | undefined;

        let str = line;
        let semicolonIndex = line.indexOf(';');
        if (semicolonIndex >= 0) {

            comment = line.slice(semicolonIndex);
            str = line.substring(0, semicolonIndex);
            if (str.match(/^\s*$/)) {
                // コメント行の場合
                return new LexerResult(undefined, undefined, undefined, undefined, undefined, comment);
            }
        }

        // TODO: コンマの区切りは引数の間にのみで使えるので
        //       ラベルと命令の間には使えないようにする
        let split = str.trim().split(/\s+|,\s+/);
        let index = 0;
        let first = split[index];
        if (Lexer.isInstruction(first)) {
            // 1つ目のトークンが命令の場合
            instruction = first;
            index++;
        } else {
            // 1つ目のトークンがラベルの場合            
            // 正常なラベルか?
            if (!Lexer.isLabel(first)) return new InvalidLabelError(lineNumber);
            if (Lexer.isGR(first)) return new InvalidLabelError(lineNumber);

            label = first;

            index++;
            let inst = split[index];
            if (!Lexer.isInstruction(inst)) return new InvalidInstructionError(lineNumber);

            instruction = inst;

            index++;
        }

        // 引数のパターンは5種類
        // 0. なし
        // 1. GR
        // 2. GR, GR
        // 3. GR, アドレス, GR
        // 4. アドレス, GR
        // 5. 語数(10進定数)   (DSのみ)
        // 6. 定数[, 定数] ... (DCのみ)

        // 引数の数を求める
        let argCount = split.length - index;

        if (instruction == 'DC') {
            // DC命令のオペランドの数は1以上である
            if (argCount == 0) return new ArgumentError(lineNumber);

            for (var i = 0; i < argCount; i++) {
                let arg = split[index + i];
                // 定数か?
                let c = Lexer.toConst(arg);
                if (c == undefined) return new ArgumentError(lineNumber);
                if (consts == undefined) {
                    consts = new Array();
                }
                consts.push(c);
            }
        } 
        else if(instruction == 'OUT'){
            // OUT   出力領域, 出力文字長さ領域

            // OUT命令の引数の数は2である
            if(argCount != 2) return new ArgumentError(lineNumber);

            const outAddress = Lexer.toAddress(split[index]);
            const outLengthAdr = Lexer.toAddress(split[index + 1]);
            
            address = outAddress;
            outLengthAddress = outLengthAdr;
        }
        else {
            if (argCount > 0) {
                // 命令の後の1つ目のトークンはレジスタまたはアドレス
                let arg1 = split[index++];
                if (Lexer.isGR(arg1)) {
                    r1 = Lexer.toGR(arg1);

                    if (argCount > 1) {
                        let arg2 = split[index++];
                        // GRまたはアドレス
                        if (Lexer.isGR(arg2)) {
                            // 2. GR, GRのパターン
                            r2 = Lexer.toGR(arg2);
                        } else {
                            // 3. GR, アドレス, GRのパターン
                            let adr = Lexer.toAddress(arg2);
                            if (!adr) return new ArgumentError(lineNumber);

                            address = adr;

                            // arg3は存在しないかもしれない
                            if (argCount == 3) {
                                let arg3 = split[index];
                                if (!Lexer.isGR(arg3)) return new ArgumentError(lineNumber);

                                r2 = Lexer.toGR(arg3);
                            }
                        }
                    }
                } else {
                    // 4. アドレス， GRのパターン
                    let adr = Lexer.toAddress(arg1);
                    if (adr == undefined) return new ArgumentError(lineNumber);

                    address = adr;

                    if (argCount == 1) {
                        if (instruction == 'DS') {
                            // 5. 語数(10進定数)パターン
                            if (typeof adr != 'number' || arg1.startsWith('#')) return new ArgumentError(lineNumber);
                            wordCount = adr;
                        }
                    }
                    else {
                        let arg2 = split[index];
                        if (!Lexer.isGR(arg2)) return new ArgumentError(lineNumber);

                        r2 = Lexer.toGR(arg2);
                    }
                }
            }
        }
        return new LexerResult(label, instruction, r1, r2, address, comment, wordCount, consts, outLengthAddress);
    }

    private static isLabel(str: string): boolean {
        // 1文字目が大文字で2文字目以降は大文字または数字である
        let regex = /\b[A-Z][A-Z0-9]*\b/;
        let result = str.match(regex);
        return result != null && str.length <= 8;
    }

    private static isInstruction(str: string): boolean {
        let regex = /\b(START|END|DS|DC|IN|OUT|RPUSH|RPOP|LD|ST|LAD|ADDA|ADDL|SUBA|SUBL|AND|OR|XOR|CPA|CPL|SLA|SRA|SLL|SRL|JPL|JMI|JNZ|JZE|JOV|JUMP|PUSH|POP|CALL|RET|SVC|NOP)\b/;
        let result = str.match(regex);
        return result != null;
    }

    private static isGR(str: string): boolean {
        let regex = /\b(GR0|GR1|GR2|GR3|GR4|GR5|GR6|GR7)\b/;
        let result = str.match(regex);
        return result != null;
    }

    private static toGR = (gr: string) => {
        if (gr == "GR0") return GR.GR0;
        if (gr == "GR1") return GR.GR1;
        if (gr == "GR2") return GR.GR2;
        if (gr == "GR3") return GR.GR3;
        if (gr == "GR4") return GR.GR4;
        if (gr == "GR5") return GR.GR5;
        if (gr == "GR6") return GR.GR6;
        if (gr == "GR7") return GR.GR7;
        else throw new Error("Unknwon GR");
    };

    private static toConst(str: string): number | string | undefined {
        // 10進定数か?
        let decimal = parseInt(str, 10);
        if (decimal) return decimal;

        // 16進定数か?
        if (str.charAt(0) == '#') {
            let hex = parseInt(str.slice(1), 16);
            if (hex) return hex;
        }

        // 文字列か?
        if (str.length > 2 &&
            str.charAt(0) == '\'' && str.charAt(str.length - 1) == '\'') return str;

        // ラベルか?
        if (Lexer.isLabel(str)) return str;

        return undefined;
    }

    private static toAddress(str: string): string | number | undefined {
        // アドレスはラベル名で指定されるかも
        if (Lexer.isLabel(str)) return str;

        // アドレスはリテラルかも
        // 1文字目と末尾の文字がシングルクォーテーションである
        if (str.charAt(0) == '\'' && str.charAt(str.length - 1) == '\'') return str;

        // アドレスは16進数かも
        // 16進定数は#で始まる数字の連続である
        if (str.charAt(0) == '#') {
            let address = parseInt(str.slice(1), 16);
            if (isNaN(address)) return address;
        }

        // アドレスは10進数かも
        // マイナスはあり得ない
        if (str.charAt(0) == '-') return undefined;
        // 10進数と解釈して変換する
        // 変換に失敗するとNaNが返る
        let address = parseInt(str, 10);
        if (isNaN(address)) {
            return undefined;
        } else {
            return address;
        }
    }
}


export class LexerResult {
    private _label: string | undefined;
    private _instruction: string | undefined;
    private _r1: GR | undefined;
    private _r2: GR | undefined;
    private _address: number | string | undefined;
    private _comment: string | undefined;
    private _isCommentLine: boolean;
    private _wordCount: number | undefined;
    private _consts: Array<number | string> | undefined;
    private _outLengthAddress:number | string | undefined;

    constructor(
        label: string | undefined,
        instruction: string | undefined,
        r1: GR | undefined,
        r2: GR | undefined,
        address: number | string | undefined,
        comment: string | undefined,
        wordCount?: number,
        consts?: Array<number | string>,
        outLengthAddress? : number | string) {
        this._label = label;
        this._instruction = instruction;
        this._r1 = r1;
        this._r2 = r2;
        this._address = address;
        this._comment = comment;
        this._wordCount = wordCount;
        this._consts = consts;
        this._outLengthAddress = outLengthAddress;

        this._isCommentLine = label == undefined &&
            instruction == undefined &&
            r1 == undefined &&
            r2 == undefined &&
            address == undefined &&
            comment != undefined;
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

    public get wordCount() {
        return this._wordCount;
    }

    public get comment() {
        return this._comment;
    }

    public get isCommentLine() {
        return this._isCommentLine;
    }

    public get consts() {
        return this._consts;
    }

    public get outLengthAddress(){
        return this._outLengthAddress;
    }

    public toString() {
        return [
            "Label:", this.label,
            "Instruction:", this.instruction,
            "r1:", this.r1,
            "r2:", this.r2,
            "Address:", this.address,
            "Comment:", this._comment].join(" ");
    }
}
