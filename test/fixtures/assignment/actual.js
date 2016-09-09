let a: string = s1;
a = s2;
let aa: ?string = s1;
aa = s2;
let aaa: string;
aaa = s2;
let b = s1;
b = s2;

let [c]: Array<number> = [n1, n2];
c = n3;

let { e }: { e: string } = { e: s3 };
e = s4;
let { f } = {};

let g: { foo: boolean, y: { bar: string }} = x();

function h<A>() {
  let x: A = 1;
  x = 2;
}

class Klass1<A> {
  method1() {
    let x: A = a
    x = b;
  }
  method2<B>() {
    let x: A | B = a;
    x = b;
  }
}

type Predicate<T> = (x: T) => boolean;
let i: Predicate<string> = () => true
i = () => false
