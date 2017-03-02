"use strict";

const blockedName = (name: string, block: number) => `${block}-${name}`;

/**
 * LabelMap
 * ラベル名とアドレスのマップを表すクラス
 */
export class LabelMap {
    private _map: Map<string, number>;
    private _bindMap: Map<string, string>;

    constructor(entries?: [string, number][]) {
        if (entries) {
            this._map = new Map(entries);
        } else {
            this._map = new Map();
        }

        this._bindMap = new Map();
    }

    public has(key: string): boolean {
        if (this._bindMap.has(key)) return true;
        if (this._map.has(key)) return true;

        return false;
    }

    public add(key: string, address: number, block?: number) {
        if (block === undefined) {
            this._map.set(key, address);
        } else {
            this._map.set(blockedName(key, block), address);
        }
    }

    public get(key: string, block?: number) {
        const k = this._bindMap.has(key) ? this._bindMap.get(key) as string :
            block !== undefined ? blockedName(key, block) : key;

        const value = this._map.get(k);
        if (value !== undefined)
            return value;
        else
            return this._map.get(key);
    }

    /**
     * keyで問い合わせられたら代わりにbindToで問い合わせる
     * START命令用
     */
    public bindAdd(key: string, bindTo: string, block?: number) {
        if (block === undefined) {
            this._bindMap.set(key, bindTo);
        } else {
            this._bindMap.set(key, blockedName(bindTo, block));
        }
    }
}