'use strict';
import { RandomLabelGenerator } from '../../src/helpers/randomLabelGenerator';
import * as assert from 'assert';

suite('Random Label Generator test', () => {
    test('test generate', () => {
        const r1 = RandomLabelGenerator.generate();
        const r2 = RandomLabelGenerator.generate();
        assert(r1 !== r2);
    });
});
