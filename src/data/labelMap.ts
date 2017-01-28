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

    public add(key: string, address: number) {
        this._map.set(key, address);
    }

    public get(key: string) {
        const k = this._bindMap.has(key) ? this._bindMap.get(key) as string : key;
        return this._map.get(k);
    }

    /**
     * keyで問い合わせられたら代わりにbindToで問い合わせる
     * START命令用
     */
    public bindAdd(key: string, bindTo: string) {
        this._bindMap.set(key, bindTo);
    }
}