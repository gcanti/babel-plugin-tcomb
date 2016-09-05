function foo({ x }: { x: string }) {
  return bar;
}

function bar({ a } = {}): string {
  return x;
}

function baz({x: {y = "ex"}}: {x: {y?: string}} = {}) {
  return x
}
