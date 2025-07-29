/**
 * @typedef {{__brand?: "MemoizationIdentifier"}} MemoizationIdentifier
 */

const memoizaionIdentifier = Symbol("memoizaionIdentifier")
const intersectionCache = Symbol("intersectionCache")
const differenceCache = Symbol("differenceCache")

/**
 * A variant of `Set` with `intersection` and `difference` memoized.
 * @template T
 * @extends {Set<T>}
 */
export class MemoizedSet extends Set {
    add(/** @type {T} */value) {
        this.resetMemoization()
        return super.add(value)
    }
    delete(/** @type {T} */value) {
        this.resetMemoization()
        return super.delete(value)
    }

    resetMemoization() {
        this[memoizaionIdentifier] = {}
        this[intersectionCache] = undefined
        this[differenceCache] = undefined
    }
    /** @type {MemoizationIdentifier} */
    [memoizaionIdentifier] = {};

    /** @type {undefined | WeakMap<MemoizationIdentifier, Set<any>>} */
    [intersectionCache] = undefined
    /** @type {Set<T>['intersection']} */
    intersection(other) {
        if (other instanceof MemoizedSet) {
            this[intersectionCache] ??= new WeakMap()
            other[intersectionCache] ??= new WeakMap()
            let cached = this[intersectionCache].get(other[memoizaionIdentifier])
            if (!cached) {
                cached = new ReadonlyMemoizedSet(super.intersection(other))
                if (this.size === cached.size && this instanceof ReadonlyMemoizedSet) {
                    cached = this
                } else if (other.size === cached.size && other instanceof ReadonlyMemoizedSet) {
                    cached = other
                }
                this[intersectionCache].set(other[memoizaionIdentifier], cached)
                other[intersectionCache].set(this[memoizaionIdentifier], cached)
            }
            return cached
        }
        return super.intersection(other)
    }

    /** @type {undefined | WeakMap<MemoizationIdentifier, Set<any>>} */
    [differenceCache] = undefined
    /** @type {Set<T>['difference']} */
    difference(other) {
        if (other instanceof MemoizedSet) {
            this[differenceCache] ??= new WeakMap()
            let cached = this[differenceCache].get(other[memoizaionIdentifier])
            if (!cached) {
                cached = new ReadonlyMemoizedSet(super.difference(other))
                this[differenceCache].set(other[memoizaionIdentifier], cached)
            }
            return cached
        }
        return super.difference(other)
    }
}

/**
 * @template T
 * @extends MemoizedSet<T>
 */
export class ReadonlyMemoizedSet extends MemoizedSet {
    constructor(/** @type {ConstructorParameters<typeof MemoizedSet<T>>} */...args) {
        super(...args)
        this.add = this.delete = () => {
            throw new Error("attempting to modify a readonly (derived) MemoizedSet")
        }
    }
}