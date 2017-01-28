'use strict';

// TODO: テストを作る

export function convert(ch: string): number {
    if (ch.length != 1) throw new Error();

    const code = map.get(ch);
    if (code == undefined) throw new Error();
    return code;
}

/**
 * JIS X 0201でサポートされる文字列かどうかを返します
 */
export function isInRange(str: string): boolean {
    for (var i = 0; i < str.length; i++) {
        const ch = str.charAt(i);
        const code = map.get(ch);
        if (code == undefined) return false;
    }

    return true;
}

// TODO: 文字コード表を完成させる
const map = new Map<string, number>([
    ['a', 0x61], ['b', 0x62], ['c', 0x63], ['d', 0x64], ['e', 0x65], ['f', 0x66], ['g', 0x67], ['h', 0x68], ['i', 0x69], ['j', 0x6A], ['k', 0x6B], ['l', 0x6C], ['m', 0x6D], ['n', 0x6E], ['o', 0x6F],
    ['p', 0x70], ['q', 0x71], ['r', 0x72], ['s', 0x73], ['t', 0x74], ['u', 0x75], ['v', 0x76], ['w', 0x77], ['x', 0x78], ['y', 0x79], ['z', 0x7A], ['{', 0x7B], ['|', 0x7C], ['}', 0x7D], ['‾', 0x7E],
]);
