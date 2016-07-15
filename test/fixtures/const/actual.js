const a: string = 's1';
const aa: ?string = 's1';
const b = 's2';

const [c]: Array<number> = [1, 2];
const [d] = [];

const { e }: { e: string } = { e: 's3' };
const { f } = {};

const g: { foo: boolean, y: { bar: string }} = x();

function h<A>() {
  const x: A = 1;
}

class Klass1<A> {
  method1() {
    const x: A = 'a'
  }
  method2<B>() {
    const x: A | B = 'a'
  }
}

type Predicate<T> = (x: T) => boolean;
const i: Predicate<string> = () => true