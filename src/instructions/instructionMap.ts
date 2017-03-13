"use strict";

import { instructionsInfo, InstructionInfo } from "@maxfield/node-casl2-comet2-core-common";

export const instructionMap = createInstructionMap(instructionsInfo);

function createInstructionMap(info: Array<InstructionInfo>): Map<string, InstructionInfo> {
    const map = new Map<string, InstructionInfo>();

    for (const x of info) {
        const key = x.instructionName;
        if (map.has(key)) {
            const v = map.get(key)!;
            const merge = x;
            merge.argumentType += v.argumentType;
            merge.code = Math.min(x.code, v.code);

            // 入れ替え
            map.set(key, merge);
        } else {
            map.set(key, x);
        }
    }

    return map;
}
