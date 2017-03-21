"use strict";

export interface Casl2CompileOption {
    /**
     * GR8をSPの操作に利用する
     */
    useGR8AsSP?: boolean;

    /**
     * ラベルのスコープを有効にする
     */
    enableLabelScope?: boolean;

    /**
     * 実効アドレスに負値をとることを許可します
     */
    allowNagativeValueForEffectiveAddress?: boolean;
}
