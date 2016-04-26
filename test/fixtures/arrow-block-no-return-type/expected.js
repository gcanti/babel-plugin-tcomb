import t from 'tcomb';
const f = x => {
  t.assert(t.String.is(x));

  return x;
};
