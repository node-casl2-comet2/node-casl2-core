'use strict';

import * as assert from 'assert';
import { escapeStringConstant } from '../src/helpers/escapeStringConstant';

suite('Single quote test', () => {
    test('test', () => {
        // 正しいシングルクォーテーションの数
        let okPattern1 = "''A''''";
        // シングルクォーテーションなし
        let okPattern2 = "ABC";

        // 不正なシングルクォーテーションの数
        let ngPattern = "''A'''B";

        let escaped = escapeStringConstant(okPattern1);
        assert(escaped != undefined);
        assert.equal(escaped, "'A''");

        escaped = escapeStringConstant(okPattern2);
        assert(escaped != undefined);
        assert.equal(escaped, "ABC");

        escaped = escapeStringConstant(ngPattern);
        assert(escaped == undefined);        
    });
});
