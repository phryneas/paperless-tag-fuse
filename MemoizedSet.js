/**
 * @typedef {{__brand?: "MemoizationIdentifier"}} MemoizationIdentifier
 */

const memoizaionIdentifier = Symbol("memoizaionIdentifier")
const intersectionCache = Symbol("intersectionCache")

/**
 * A variant of `Set` with a few methods like `intersection` memoized.
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
}

/**
 * @template T
 * @extends MemoizedSet<T>
 */
class ReadonlyMemoizedSet extends MemoizedSet {
    constructor(/** @type {ConstructorParameters<typeof MemoizedSet<T>>} */...args) {
        super(...args)
        this.add = this.delete = () => {
            throw new Error("attempting to modify a readonly (derived) MemoizedSet")
        }
    }
}