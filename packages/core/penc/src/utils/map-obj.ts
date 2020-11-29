

/**
 * Returns a new Map whose keys are the same as the keys in `m`,
 * and whose values are the results of calling `cb` on each value in `m`.
 */
export function mapObj<K extends string, V, Vᐟ>(obj: Readonly<Record<K, V>>, cb: (v: V, k: K) => Vᐟ): Readonly<Record<K, Vᐟ>> {
    const result = {} as Record<K, Vᐟ>;
    for (const key of Object.keys(obj) as K[]) {
        result[key] = cb(obj[key], key);
    }
    return result;
}
