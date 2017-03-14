"use strict";

import { TokenInfo } from "../casl2/lexer/token";

const scopedName = (name: string, scope: number) => `${scope}_${name}`;

export interface LabelInfo {
    /**
     * ラベルの番地
     */
    address: number;

    /**
     * ラベルのトークン
     */
    token?: TokenInfo;

    /**
     * ラベルを参照しているトークン
     */
    references?: Array<TokenInfo>;
}

export interface BindLabelInfo {
    /**
     * 問い合わせ先
     */
    bindTo: string;

    /**
     * ラベルのトークン
     */
    token: TokenInfo;
}

/**
 * LabelMap
 * ラベル名とアドレスのマップを表すクラス
 */
export class LabelMap {
    private _map: Map<string, LabelInfo>;
    private _bindMap: Map<string, BindLabelInfo>;

    constructor() {
        this._map = new Map();

        this._bindMap = new Map();
    }

    public has(key: string, scope?: number): boolean {
        const k = scope === undefined ? key : scopedName(key, scope);
        if (this._bindMap.has(k)) return true;
        if (this._map.has(k)) return true;

        return false;
    }

    public add(key: string, info: LabelInfo, scope?: number): void {
        if (scope === undefined) {
            this._map.set(key, info);
        } else {
            this._map.set(scopedName(key, scope), info);
        }
    }

    public get(key: string, scope?: number): LabelInfo | undefined {
        const k = this._bindMap.has(key) ? (this._bindMap.get(key) as BindLabelInfo).bindTo :
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
    public bindAdd(key: string, token: TokenInfo, bindTo: string, scope?: number) {
        if (scope === undefined) {
            this._bindMap.set(key, { bindTo: bindTo, token: token });
        } else {
            this._bindMap.set(key, { bindTo: scopedName(bindTo, scope), token: token });
        }
    }

    getAllReferenceableLabels(scope: number): Array<TokenInfo> {
        // グローバルに参照できるものと
        // 同じスコープのものに絞る
        // スコープのあるものは1_L1のようにスコープ付きの名前で登録されているので
        // '1_'の部分を取り除いている
        const a = Array.from(this._map.keys())
            .filter(x => !x.match(/^\d/) || x.startsWith(scope.toString()))
            .map(x => this._map.get(x)!.token!);

        const b = Array.from(this._bindMap.values()).map(x => x.token);
        return a.concat(b);
    }

    findAllReferences(includeDeclaration = true, label: string, scope?: number): Array<TokenInfo> | undefined {
        const a = this.get(label, scope);
        if (a === undefined) return undefined;

        if (includeDeclaration) {
            const base = a.token ? [a.token] : [];
            const refs = a.references || [];
            return base.concat(refs);
        } else {
            return a.references;
        }
    }
}
