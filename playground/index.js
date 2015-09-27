import t from 'tcomb';

function sum(x: t.Number, y: t.Number): t.Number {
  return x + y + 'a';
}

sum(1, 2);