"use strict";

export interface Casl2CompileOption {
    /**
     * GR8をSPの操作に利用する
     */
    useGR8?: boolean;

    /**
     * ラベルのスコープを有効にする
     */
    enableLabelScope?: boolean;
}
