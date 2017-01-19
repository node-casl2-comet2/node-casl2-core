/**
 * LabelMap
 * ラベル名とアドレスのマップを表すクラス
 */
export class LabelMap {
    private _map: Map<string, number>;
    constructor(entries?: [string, number][]) {
        if (entries) {
            this._map = new Map(entries);
        } else {
            this._map = new Map();
        }
    }

    public add(key: string, address: number) {
        this._map.set(key, address);
    }

    public get(key: string) {
        return this._map.get(key);
    }
}