import t from 'tcomb';
function foo(x: t.Number, y = 1: t.Number) {
  return x + y;
}
