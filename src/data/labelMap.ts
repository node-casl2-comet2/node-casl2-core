"use strict";

const scopedName = (name: string, scope: number) => `${scope}_${name}`;

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

    public has(key: string, scope?: number): boolean {
        const k = scope === undefined ? key : scopedName(key, scope);
        if (this._bindMap.has(k)) return true;
        if (this._map.has(k)) return true;

        return false;
    }

    public add(key: string, address: number, scope?: number) {
        if (scope === undefined) {
            this._map.set(key, address);
        } else {
            this._map.set(scopedName(key, scope), address);
        }
    }

    public get(key: string, scope?: number) {
        const k = this._bindMap.has(key) ? this._bindMap.get(key) as string :
            scope !== undefined ? scopedName(key, scope) : key;

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
    public bindAdd(key: string, bindTo: string, scope?: number) {
        if (scope === undefined) {
            this._bindMap.set(key, bindTo);
        } else {
            this._bindMap.set(key, scopedName(bindTo, scope));
        }
    }

    getAllReferenceableLabels(scope: number) {
        // グローバルに参照できるものと
        // 同じスコープのものに絞る
        // スコープのあるものは1_L1のようにスコープ付きの名前で登録されているので
        // '1_'の部分を取り除いている
        const a = Array.from(this._map.keys())
            .filter(x => !x.match(/^\d/) || x.startsWith(scope.toString()))
            .map(x => x.replace(/^\d+_/, ""));
        const b = Array.from(this._bindMap.keys());
        return a.concat(b);
    }
}
