import t from "tcomb";

type T1<T> = Array<T>;
type T2<T> = Promise<T>;
type T3<T> = T | "a";
