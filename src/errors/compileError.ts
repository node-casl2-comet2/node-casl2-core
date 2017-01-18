'use strict';

/**
 * コンパイルエラーの基底クラス
 */
export class CompileError {
    // エラーメッセージ
    private _message: string;
    // エラーの行番号
    private _lineNumber: number;
    // エラーの始まりのインデックス
    private _startIndex: number;
    // エラーの終わりのインデックス
    private _endIndex: number;

    constructor(message: string, lineNumber: number, startIndex?: number, endIndex?: number) {
        this._message = message;
        this._lineNumber = lineNumber;
        this._startIndex = startIndex;
        this._endIndex = endIndex;
    }

    public get message() {
        return this._message;
    }

    public get lineNumber() {
        return this._lineNumber;
    }

    public get startIndex() {
        return this._startIndex;
    }

    public get endIndex() {
        return this._endIndex;
    }

    public toString() {
        return [
            "Message:", this.message,
            "Line:", this.lineNumber].join(" ");
    }
}
