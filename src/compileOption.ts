"use strict";

export interface Casl2CompileOption {
    /**
     * GR8を有効な汎用レジスタとして使用する
     */
    useGR8?: boolean;

    /**
     * ラベルのスコープを有効にする
     */
    enableLabelScope?: boolean;

    /**
     * 実効アドレスに負値をとることを許可します
     */
    allowNagativeValueForEffectiveAddress?: boolean;
}
