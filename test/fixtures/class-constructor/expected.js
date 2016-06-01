import t from 'tcomb';
class A {
  constructor(x: t.String) {
    t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

    this.x = x;
  }
}
