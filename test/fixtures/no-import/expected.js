import t from 'tcomb';

function identity(x: t.String) {
  x = t.String(x);

  return x;
}

