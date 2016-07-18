type A<T> = $Keys<T>;
type B<T> = T & $Shape<T>;
type C = $Shape<{name: string}>;