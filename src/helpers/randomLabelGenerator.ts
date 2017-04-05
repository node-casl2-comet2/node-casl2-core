"use strict";

export class RandomLabelGenerator {
    public static generate() {
        const c = "abcdefghijklmnopqrstuvwxyz";
        const length = 8;
        let result = "";
        for (let i = 0; i < length; i++) {
            result += c[Math.floor(Math.random() * c.length)];
        }

        return result;
    }
}
