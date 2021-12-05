// Source: https://github.com/microsoft/TypeScript/issues/30680#issuecomment-752725353

export type Narrow<A> = Cast<A,
    | []
    | (A extends Narrowable ? A : never)
    | ({ [K in keyof A]: Narrow<A[K]> })
>;

type Cast<A, B> = A extends B ? A : B;

type Narrowable = string | number | bigint | boolean;

// declare function foo<A>(x: Narrow<A>): A;
// declare function bar<A extends object>(x: Narrow<A>): A;

// const test0 = foo({a: 1, b: 'c', d: ['e', 2, true, {f: ['g']}]});
// // `A` inferred : {a: 1, b: 'c', d: ['e', 2, true, {f: ['g']}]}

// const test1 = bar({a: 1, b: 'c', d: ['e', 2, true, {f: ['g']}]});
// // `A` inferred : {a: 1, b: 'c', d: ['e', 2, true, {f: ['g']}]}

// const test3 = foo('hello jcalz <3');
// // `A` inferred : 'hello jcalz <3'

