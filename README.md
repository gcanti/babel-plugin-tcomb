# Setup

```sh
npm install babel-plugin-tcomb
```

## Webpack config

```js
module: {
  loaders: [
    {
      test: /\.jsx?$/,
      loader: 'babel?plugins=babel-plugin-tcomb'
    }
  ]
}
```

# Supported features

## Built-in and user defined types (`struct` combinator)

```js
import t from 'tcomb';

function foo(x: t.String) {
  return x;
}

foo(1); // => throws [tcomb] Invalid value 1 supplied to String
```

## `maybe` combinator

```js
function foo(x: ?t.String) {
  return x || 'Empty';
}
```

## `list` combinator

```js
function foo(x: Array<t.String>) {
  return x;
}
```

## `tuple` combinator

```js
function foo(x: [t.String, t.Number]) {
  return x;
}
```

## `union` combinator

```js
function foo(x: t.String | t.Number) {
  return x;
}
```

## `dict` combinator

```js
function foo(x: {[key: t.String]: t.Number}) {
  return x;
}
```

## `intersection` combinator

```js
function foo(x: t.Number & t.String) {
  return x;
}
```

## Arrow functions

```js
const f = (x: t.String): t.String => x;
```

## Classes

```js
class A {
  foo(x: t.String): t.String {
    return x;
  }
}
```