'use strict';

import { InstructionBase } from './instructionBase';

export class MDC extends InstructionBase {
    private _charLiteral: string | undefined;

    constructor(label: string | undefined, constant: number | string) {
        if (typeof constant == 'string' && constant.startsWith('\'')) {
            // 文字列定数の場合
            super('MDC', undefined, label);
            this._charLiteral = (constant as string).charAt(1);
        } else {
            // その他の場合はアドレスとして保持しておく
            let address = constant;
            super('MDC', undefined, label, undefined, undefined, address);
        }
    }

    public toHex(): number {
        if (this._charLiteral) {
            if (this._charLiteral.length != 1) throw new Error();

            let asciiCode = this._charLiteral.charCodeAt(0);
            let hex = asciiCode;
            return hex;
        } else {
            let hex = this.address as number;
            return hex;
        }
    }

    public get byteLength() {
        return 2;
    }
}