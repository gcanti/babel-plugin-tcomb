let a: string = 's1';
let aa: ?string = 's1';
let b = 's2';

let [c]: Array<number> = [1, 2];
let [d] = [];

let { e }: { e: string } = { e: 's3' };
let { f } = {};

let g: { foo: boolean, y: { bar: string }} = x();

function h<A>() {
  let x: A = 1;
}

class Klass1<A> {
  method1() {
    let x: A = 'a'
  }
  method2<B>() {
    let x: A | B = 'a'
  }
}

type Predicate<T> = (x: T) => boolean;
let i: Predicate<string> = () => true
