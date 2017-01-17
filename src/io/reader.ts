'use strict';

import * as fs from 'fs';

export class Reader {
    public static read(path: string): Buffer {
        let buf = fs.readFileSync(path);
        return buf;
    }
}
