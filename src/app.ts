'use strict';

import { Reader } from './io/reader';
import { Instructions } from './instructions/instructions';
import { InstructionBase } from './instructions/instructionBase';
import { GR } from './comet2/gr';
import { CompileError } from './errors/compileError';
import { Lexer } from './casl2/lexer';

// .casファイルを読み込む
// .casファイルかどうかのバリデーションは外部でやる

let buf = Reader.read('./test/testdata/src01.cas');

let splits = buf.toString().split('\n');
let errors: Array<CompileError> = [];
let instructions: Array<InstructionBase> = [];

// 一行ずつに分ける
for (var i = 0; i < splits.length; i++) {
    let line = splits[i];
    let lineNumber = i + 1;

    console.log(line);
}

let adda1 = Instructions.adda(null, GR.GR1, GR.GR2);
let adda2 = Instructions.adda(null, GR.GR1, 3, GR.GR2);

console.log(adda1.toString());
console.log(adda2.toString());

if (errors.length != 0) {
    // コンパイルエラーありの場合
    errors.forEach(error => console.log(error.message));
} else {
    // コンパイル成功の場合
    instructions.forEach(inst => console.log(inst));
}


// JPL 5, GR2
let result = Lexer.tokenize("JPL 5", 1);
if (result instanceof CompileError) {

} else {
    if (result.isCommentLine) {
        // コメント行なので無視する
    } else {
        let inst = Instructions.create(result, 1);
        if (inst instanceof InstructionBase) {
            console.log(inst.toHex());
            instructions.push(inst);
        } else {
            // コンパイルエラー
        }
    }
}

console.log(result.toString());
