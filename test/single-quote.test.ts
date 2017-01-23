'use strict';

import * as assert from 'assert';

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

    function escapeStringConstant(str: string): string | undefined {
        let replaced = str.replace(/''/g, "");

        // シングルクォーテーションが2つ連続しているものを空文字に置換しても
        // まだシングルクォーテーションが残っているということは奇数個のシングルクォーテーションが
        // 連続しているということだから不正
        if (replaced.indexOf("'") >= 0) return undefined;

        // シングルクォーテーション2つを1つに置換する
        let escaped = str.replace(/''/g, "'");
        return escaped;
    }
});
