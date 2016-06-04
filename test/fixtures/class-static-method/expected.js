import t from 'tcomb';
class A {
  static f(x: t.String) {
    _assert(x, t.String, 'x');

    return x;
  }
}
