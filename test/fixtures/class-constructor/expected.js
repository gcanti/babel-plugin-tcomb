import t from 'tcomb';

class A {
  constructor(x) {
    _assert(x, t.String, "x");

    this.x = x;
  }

}
