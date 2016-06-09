import t from 'tcomb';

const T1 = t.interface({
  name: t.String
}, 'T1');
const T2 = t.Number;
const T3 = t.union([t.Number, T1], 'T3');
const T4 = t.list(t.String, 'T4');
const T5 = t.Function;
const T6 = t.maybe(t.String, 'T6');
const T7 = t.tuple([t.String, t.Number], 'T7');
const T8 = t.dict(t.String, t.Number, 'T8');
const T9 = t.intersection([t.String, t.Number], 'T9');
const T10 = t.enums.of(['a', 'b'], 'T10');
const T11 = t.union([t.enums.of(['a']), t.Number], 'T11');
const T12 = t.union([t.refinement(t.Number, function (n) {
  return n === 1;
}), t.refinement(t.Number, function (n) {
  return n === 2;
})], 'T12');
const T13 = t.refinement(t.Number, isPositive, 'T13');
const T14 = t.refinement(t.Number, Integer.is, 'T14');
