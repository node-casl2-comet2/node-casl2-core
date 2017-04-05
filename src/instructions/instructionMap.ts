"use strict";

import { instructionsInfo, InstructionInfo } from "@maxfield/node-casl2-comet2-core-common";

export const instructionMap = createInstructionMap(instructionsInfo);

function createInstructionMap(info: Array<InstructionInfo>): Map<string, InstructionInfo> {
    const map = new Map<string, InstructionInfo>();

    for (const x of info) {
        const key = x.instructionName;
        if (map.has(key)) {
            const v = map.get(key)!;

            const merge: InstructionInfo = {
                documentation: v.documentation,
                instructionName: v.instructionName,
                type: v.type,
                argumentType: v.argumentType + x.argumentType,
                code: Math.min(x.code, v.code)
            }

            // 入れ替え
            map.set(key, merge);
        } else {
            // オブジェクトを複製しないとargumentTypeを
            // 足す処理で元のオブジェクトを操作することになる
            map.set(key, Object.assign({}, x));
        }
    }

    return map;
}
