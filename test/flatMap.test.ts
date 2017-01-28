suite('flatmap', () => {
    test('', () => {
        const array = [1, [2, 3], [4, [5]]];
        const result = array.concat.apply([], array);
        console.log(result);
    });
});
