'use strict';

import * as fs from 'fs';

export class Writer {
    public static binaryWrite(path: string) {
        // let buffer = new Uint16Array(8);
        // buffer[0] = 0x8100;

        // let buf = new Buffer(buffer.buffer);

        let buffer = new Buffer([1,2,3]);
        fs.writeFileSync(path, buffer);
    }
}
