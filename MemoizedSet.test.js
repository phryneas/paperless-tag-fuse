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

test("derived MemoizedSets are readonly", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const intersection = setA.intersection(setB)
    assert.throws(() => intersection.add(5))
    assert.throws(() => intersection.delete(5))
})

test("intersecting a `ReadonlyMemoizedSet` with a similar `MemoizedSet` will result in `this` being returned", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const setC = new MemoizedSet([2])
    const intersection = setA.intersection(setB)
    assert.strictEqual(intersection, intersection.intersection(setA))
    assert.strictEqual(intersection, intersection.intersection(setB))
    assert.strictEqual(intersection, intersection.intersection(setC))
    assert.strictEqual(intersection, intersection.intersection(intersection))
})

test("intersecting a `MemoizedSet` with a similar `ReadonlyMemoizedSet` will result in `other` being returned", () => {
    const setA = new MemoizedSet([1, 2])
    const setB = new MemoizedSet([2, 3])
    const setC = new MemoizedSet([2])
    const intersection = setA.intersection(setB)
    assert.strictEqual(intersection, setA.intersection(intersection))
    assert.strictEqual(intersection, setB.intersection(intersection))
    assert.strictEqual(intersection, setC.intersection(intersection))
})