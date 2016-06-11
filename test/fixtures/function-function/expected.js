function foo(f) {
  _assert(f, _t.Function, 'f');

  return f('a');
}

function bar(f) {
  _assert(f, _t.Function, 'f');

  return f('a');
}
