"use strict";

import { GR } from "../comet2/gr";

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
    private _lengthAddress: number | string | undefined;

    constructor(
        label: string | undefined,
        instruction: string | undefined,
        r1: GR | undefined,
        r2: GR | undefined,
        address: number | string | undefined,
        comment: string | undefined,
        wordCount?: number,
        consts?: Array<number | string>,
        lengthAddress?: number | string) {
        this._label = label;
        this._instruction = instruction;
        this._r1 = r1;
        this._r2 = r2;
        this._address = address;
        this._comment = comment;
        this._wordCount = wordCount;
        this._consts = consts;
        this._lengthAddress = lengthAddress;

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
