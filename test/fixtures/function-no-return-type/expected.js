import t from 'tcomb';
function foo(x: t.Number, y: t.String) {
  _assert(x, t.Number, 'x');

  _assert(y, t.String, 'y');

  return x + y;
}
