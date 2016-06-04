import t from 'tcomb';
class A {
  constructor(x: t.String) {
    _assert(x, t.String, 'x');

    this.x = x;
  }
}
