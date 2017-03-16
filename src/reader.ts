"use strict";

import * as fs from "fs";

export function read(path: string) {
    // .casファイルを読み込む
    const buf = fs.readFileSync(path);

    // 末尾の改行を取り除いて一行ずつに分ける
    const lines = buf.toString().replace(/(\r\n|\r|\n)+$/, "").split(/\r\n|\r|\n/);

    return lines;
}
