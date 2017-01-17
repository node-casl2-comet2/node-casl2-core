'use strict';

import { InstructionBase } from './instructionBase';
import { GR } from '../comet2/gr';

export class Instructions {
    /**
     * START命令
     */
    public static start(label?: string) {
        return new InstructionBase("START", null, label);
    }

    /**
     * RET命令
     */
    public static ret(label?: string) {
        return new InstructionBase("RET", 0x81, label);
    }

    /**
     * END命令
     */
    public static end() {
        return new InstructionBase("END", null);
    }

    /**
     * LAD命令
     */
    public static lad(label: string, r: GR, adr: number, x?: GR) {
        return new InstructionBase("LAD", 0x12, label, r, x, adr);
    }

    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, r2: GR): InstructionBase;
    /**
     * ADDA命令
     */
    public static adda(label: string, r1: GR, adr: number, x?: GR): InstructionBase;
    public static adda(label: string, x1: any, x2: any, x3?: any): InstructionBase {
        if (x3) {
            // アドレス有り
            return new InstructionBase("ADDA", 0x20, label, x1, x3, x2);
        } else {
            // アドレス無し
            return new InstructionBase("ADDA", 0x24, label, x1, x2).confirmed();
        }
    }
}
