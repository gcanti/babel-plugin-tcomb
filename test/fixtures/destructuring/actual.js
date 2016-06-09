import t from 'tcomb';

function foo({ x }: { x: t.String }) {
  return bar;
}

function bar({ a } = {}): t.String {
  return x;
}