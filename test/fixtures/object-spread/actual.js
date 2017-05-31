type A = {
    a: string
};

type B = {
    b: string,
    ...$Exact<A>,
    c: string,
};

type C = {
    d: string,
    ...B,
    f: string
};
