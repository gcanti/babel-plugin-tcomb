import t from 'tcomb';

const f = x => {
  _assert(x, t.String, "x");

  return x;
};
