import t from 'tcomb';
class A {
  constructor(x: t.String) {
    t.assert(t.String.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

    this.x = x;
  }
}
