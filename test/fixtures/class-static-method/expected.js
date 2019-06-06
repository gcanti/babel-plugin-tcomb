import t from 'tcomb';

class A {
  static f(x) {
    _assert(x, t.String, "x");

    return x;
  }

}
