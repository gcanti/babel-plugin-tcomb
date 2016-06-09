import t from 'tcomb';
function foo(x) {
  _assert(x, t.dict(t.String, t.Number), 'x');

  return x;
}
