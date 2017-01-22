'use strict';

import { Reader } from './io/reader';
import { Writer } from '../src/io/writer';
import { Casl2 } from './casl2';
import { Instructions } from './instructions/instructions';
import { Lexer, LexerResult } from './casl2/lexer';
import { InstructionBase } from './instructions/instructionBase';


// .casファイルを読み込む
let buf = Reader.read('./test/testdata/src04.cas');

// 末尾の改行を取り除いて一行ずつに分ける
let lines = buf.toString().replace(/(\r\n|\r|\n)+$/, "").split(/\r\n|\r|\n/);
let casl2 = new Casl2();
let result = casl2.compile(lines);

if (result.success) {
    // コンパイル成功の場合
    Writer.binaryWrite("temp.com", result.instructions.map(x => x.toHex()).filter(x => x != -1));
} else {
    // コンパイルエラーありの場合
    result.errors.forEach(error => console.log(error.message));
}

