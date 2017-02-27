"use strict";

import * as fs from "fs";

export function binaryRead(path: string): Array<number> {
    const buffer = fs.readFileSync(path);
    const dump = buffer.toString("hex", 0, buffer.length);
    const hex = toHex(dump);
    return hex;
}

function toHex(dump: string): Array<number> {
    const memory: Array<number> = [];

    const length = dump.length;

    // 16進数にダンプしたものはCOMET2の一語は16ビット(2バイト)なので
    // 長さが必ず4の倍数になる
    if (length % 4 != 0) throw new Error();

    // 4桁ごと(2バイトごと)に区切って数値に変換
    for (let i = 0; i < length / 4; i++) {
        const start = 4 * i;
        const end = start + 4;
        const slice = dump.slice(start, end);

        // 16進数文字列を数値に変換
        memory.push(parseInt(slice, 16));
    }

    return memory;
}
