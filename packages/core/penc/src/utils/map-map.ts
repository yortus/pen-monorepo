

/**
 * Returns a new Map whose keys are the same as the keys in `m`,
 * and whose values are the results of calling `cb` on each value in `m`.
 */
export function mapMap<K, V, Vᐟ>(m: ReadonlyMap<K, V>, cb: (v: V, k: K) => Vᐟ): Map<K, Vᐟ> {
    const result = new Map<K, Vᐟ>();
    for (const [key, value] of m.entries()) {
        result.set(key, cb(value, key));
    }
    return result;
}
