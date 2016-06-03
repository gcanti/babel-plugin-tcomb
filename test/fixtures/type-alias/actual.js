import t from 'tcomb';

type T1 = {
  name: string
};
type T2 = number;
type T3 = number | T1;
type T4 = Array<string>;
type T5<U, V> = (x: U) => V;
type T6 = ?string;
type T7 = [string, number];
type T8 = {[key: string]: number};
type T9 = string & number;
type T10 = 'a' | 'b';
type T11 = 'a' | number;
type T12 = 1 | 2;
