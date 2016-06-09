import t from "tcomb";

type A<T> = T & $Shape<T>;
type B = $Shape<{name: string}>;