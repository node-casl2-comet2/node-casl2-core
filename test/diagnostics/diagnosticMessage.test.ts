"use strict";

import * as assert from "assert";
import { formatMessage } from "../../src/diagnostics/diagnosticMessage";

suite("Diagnostic message", () => {
    test("format message", () => {
        const s = "'{0}' expected.";
        const format = formatMessage(s, [";"]);
        assert.equal(format, "';' expected.");
    });
});
