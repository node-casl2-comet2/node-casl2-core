"use strict";

import { GR } from "@maxfield/node-casl2-comet2-core-common";

export class LexerResult {
    private _isCommentLine: boolean;

    constructor(
        private _label: string | undefined,
        private _instruction: string | undefined,
        private _r1: GR | undefined,
        private _r2: GR | undefined,
        private _address: number | string | undefined,
        private _comment: string | undefined,

        /** DS命令の語数 */
        private _wordCount?: number,

        private _consts?: Array<number | string>,
        private _lengthAddress?: number | string) {

        this._isCommentLine = this._label == undefined &&
            this._instruction == undefined &&
            this._r1 == undefined &&
            this._r2 == undefined &&
            this._address == undefined &&
            this._comment != undefined;
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

    /** DS命令の語数 */
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

    public get lengthAddress() {
        return this._lengthAddress;
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
