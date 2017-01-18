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


let result = Lexer.tokenize("NOP", 1);
if (result instanceof CompileError) {

} else {
    if (result.isCommentLine) {
        // コメント行なので無視する
    } else {

        if (result.instruction == "LAD") {
            // LAD命令の処理をする
            // rとアドレスが存在することをチェックする(両方なければエラーである)
            if (!(result.r1 && result.address)) throw new Error();
            let lad = Instructions.lad(result.label, result.r1, result.address, result.r2);
            instructions.push(lad);
        }
        if (result.instruction == "ADDA") {
            // ADDA命令の処理をする
            // r1とr2またはr1とアドレスが存在することをチェックする
            if (result.address) {
                if (!result.r1) throw new Error();
                let adda = Instructions.adda(result.label, result.r1, result.address, result.r2);
                instructions.push(adda);
            } else {
                if (!(result.r1 && result.r2)) throw new Error();
                let adda = Instructions.adda(result.label, result.r1, result.r2);
                instructions.push(adda);
            }
        }
    }
}

console.log(result.toString());
