"use strict";

/**
 * コンパイルエラーの基底クラス
 */
export class CompileError {
    // エラーの行番号
    private _lineNumber: number;
    // エラーメッセージ
    private _message: string;
    // エラーコード
    private _errorCode: number | undefined;
    // エラーの始まりのインデックス
    private _startIndex: number | undefined;
    // エラーの終わりのインデックス
    private _endIndex: number | undefined;

    // TODO: lineNumberを第一引数にし，messageをoptionalにする
    constructor(lineNumber: number, message: string, errorCode?: number, startIndex?: number, endIndex?: number) {
        this._lineNumber = lineNumber;
        this._message = message;
        this._errorCode = errorCode;
        this._startIndex = startIndex;
        this._endIndex = endIndex;
    }

    public get lineNumber() {
        return this._lineNumber;
    }

    public get message() {
        return this._message;
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
