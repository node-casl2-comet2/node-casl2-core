'use strict';

import { Lexer } from '../../src/casl2/lexer';
import { CompileError } from '../../src/errors/compileError';
import * as assert from 'assert';

suite('Lexer test', () => {
    test('tokenize test', () => {
        let line = "CASL2 START";
        let result = Lexer.tokenize(line, 3);
        if (result instanceof CompileError) {
            throw new Error("error");
        } else {

        }
    });
});