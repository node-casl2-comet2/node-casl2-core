'use strict';

import { InstructionBase } from './instructionBase';
import { LabelMap } from '../data/labelMap';

export class OUT extends InstructionBase {
    private _outLengthAddress: number | string;

    constructor(label: string | undefined, outAddress: number | string, outLengthAddress: number | string) {
        super('OUT', 0x91, label, undefined, undefined, outAddress);
        this._outLengthAddress = outLengthAddress;
    }

    public toHex(): number[] {
        const hex = [];
        hex.push(this.code as number);
        hex.push(this.address as number);
        hex.push(this._outLengthAddress as number); 
        
        return hex;
    }

    public get byteLength() {
        return 6;
    }

    public resolveAddress(labelMap: LabelMap) {
        if (this.isConfirmed) return;

        if (typeof this.address != 'number') {
            let resolvedAddress = labelMap.get(this.address as string);
            if (resolvedAddress == undefined) throw new Error('undeclared label: ' + this.address as string);
            this.setAddress(resolvedAddress);
        }
        if (typeof this._outLengthAddress != 'number') {
            let resolvedAddress = labelMap.get(this._outLengthAddress as string);
            if (resolvedAddress == undefined) throw new Error('undeclared label: ' + this.address as string);
            this._outLengthAddress = resolvedAddress;
        }
    }

    private get isConfirmed() {
        return typeof this.address == 'number' && typeof this._outLengthAddress == 'number';
    }
}
