import { test } from 'node:test'
import assert from 'node:assert'
import { MemoizedSet } from "./MemoizedSet.js"

test("memoizes intersections both ways", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const intersection = setA.intersection(setB)
    assert.deepStrictEqual([...intersection], [2])
    assert.strictEqual(intersection, setA.intersection(setB))
    assert.strictEqual(intersection, setB.intersection(setA))
})

test("recomputes once a new value is added to self", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const intersection = setA.intersection(setB)
    setA.add(5)
    assert.deepStrictEqual([...intersection], [2])
    assert.notStrictEqual(intersection, setA.intersection(setB))
    assert.notStrictEqual(intersection, setB.intersection(setA))
    assert.strictEqual(setA.intersection(setB), setB.intersection(setA))
})

test("recomputes once a new value is added to other", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const intersection = setA.intersection(setB)
    setB.add(5)
    assert.deepStrictEqual([...intersection], [2])
    assert.notStrictEqual(intersection, setA.intersection(setB))
    assert.notStrictEqual(intersection, setB.intersection(setA))
    assert.strictEqual(setA.intersection(setB), setB.intersection(setA))
})
