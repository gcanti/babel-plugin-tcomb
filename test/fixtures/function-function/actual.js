function foo(f: (x: string) => string) {
  return f('a');
}

function bar(f: Function) {
  return f('a');
}

