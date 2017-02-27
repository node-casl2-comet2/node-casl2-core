"use strict";

/**
 * コンパイルエラーの基底クラス
 */
export class CompileError {
    private _message: string;

    constructor(
        private _lineNumber: number,
        message?: string,
        private _errorCode?: number,
        private _startIndex?: number,
        private _endIndex?: number) {
        this._message = message || "Compile error";
    }

    /**
     * エラーの行番号
     */
    public get lineNumber() {
        return this._lineNumber;
    }

    /**
     * エラーメッセージ
     */
    public get message() {
        return this._message;
    }

    /**
     * エラーの始まりのインデックス
     */
    public get startIndex() {
        return this._startIndex;
    }

    /**
     * エラーの終わりのインデックス
     */
    public get endIndex() {
        return this._endIndex;
    }

    public toString() {
        return [
            "Message:", this.message,
            "Line:", this.lineNumber].join(" ");
    }
}
