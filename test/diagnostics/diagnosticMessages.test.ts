"use strict";

import * as assert from "assert";
import * as _ from "lodash";
import { Diagnostics } from "../../src/diagnostics/diagnosticMessages";

suite("diagnostic messages test", () => {
    // 診断コードに重複はないか?
    test("diagnostic code", () => {
        const diagnostics = _.values(Diagnostics);

        const codes = diagnostics.map(x => x.code);
        const unique = _.uniq(codes);

        assert.deepEqual(codes, unique);
    });
});
