function foo(a = 'foo') {
  return a;
}

const bar = ({ x, y: { z } }) => {
  return x + z;
};

class Baz {
  foo(x) {
    return x;
  }
}
