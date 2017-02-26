"use strict";

export function escapeStringConstant(str: string): string | undefined {
    const replaced = str.replace(/''/g, "");

    // シングルクォーテーションが2つ連続しているものを空文字に置換しても
    // まだシングルクォーテーションが残っているということは奇数個のシングルクォーテーションが
    // 連続しているということだから不正
    if (replaced.indexOf("'") >= 0) return undefined;

    // シングルクォーテーション2つを1つに置換する
    const escaped = str.replace(/''/g, "'");
    return escaped;
}
