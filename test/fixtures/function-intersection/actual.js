import t from 'tcomb';
function foo(x: t.Number & t.String) {
  return x;
}
