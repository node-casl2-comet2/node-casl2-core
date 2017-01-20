'use strict';

import * as fs from 'fs';

export class Writer {
    public static binaryWrite(path: string, numbers: Array<number>) {
        let buffer = Writer.createBinaryBuffer(numbers);

        fs.writeFileSync(path, buffer);
    }

    public static createBinaryBuffer(numbers: Array<number>): Buffer {
        let byteLength = numbers
            .map(n => n.toString(16).length)
            .reduce((prev, current, _, __) => prev + current) / 2;

        let arrayBuffer = new ArrayBuffer(byteLength);
        let view = new DataView(arrayBuffer);

        let byteOffset = 0;
        for (var i = 0; i < numbers.length; i++) {
            let n = numbers[i];
            // 16進数での桁数を調べる
            let digit = n.toString(16).length;
            if (digit == 8) {
                // 第3引数にfalseを指定するとビッグエンディアンになる
                view.setUint32(byteOffset, n, false);
                byteOffset += 4;
            } else if (digit == 4) {
                view.setUint16(byteOffset, n, false);
                byteOffset += 2;
            } else throw new Error("invalid hex code length.");
        }

        return new Buffer(arrayBuffer);
    }
}
