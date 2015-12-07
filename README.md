[tcomb](https://github.com/gcanti/tcomb) is a library for Node.js and the browser which allows you to check the types of JavaScript values at runtime with a simple and concise syntax. It's great for Domain Driven Design and for adding safety to your internal code.

babel-plugin-tcomb is a babel plugin for runtime type checking using tcomb. You can annotate a function (arguments and return type) with tcomb types.

# How it works

```js
import t from 'tcomb';

// add type annotations
function foo(x: t.Number, y: t.String): t.String {
  return x + y;
}

// compiled to
function foo(x: t.Number, y: t.String): t.String {

  // check the arguments: tcomb types are identity functions
  // containing type asserts
  x = t.Number(x);
  y = t.String(y);

  // exec the original function
  const ret = function (x, y) {
    return x + y;
  }(x, y);

  // check the return type
  return t.String(ret);
}
```

Now the `foo` function is type-checked, this means...

```js
foo(1, 'a'); // => ok
foo(1, 2); // => ...will throws "[tcomb] Invalid value 2 supplied to String"
```

# Caveats

- Destructuring and typed default values are not (yet) supported

# Setup

First, install via npm.

```sh
npm install --save-dev babel-plugin-tcomb
```

Then, in your babel configuration (usually in your .babelrc file), add "tcomb" to your list of plugins:

```json
{
  "plugins": ["tcomb"]
}
```

or

```json
"env": {
  "development": {
    "plugins": [
      "tcomb"
    ]
  }
}
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

# Features

**`struct` combinator**

```js
const Person = t.struct({
  name: t.String
});

function foo(person: Person) {
  return person.name;
}

// compiles to
function foo(person: Person) {
  person = Person(person);

  return person.name;
}
```

**`refinement` combinator**

```js
const Integer = t.refinement(t.Number, (n) => n % 1 === 0);

function foo(x: Integer) {
  return x;
}

// compiles to
function foo(x: Integer) {
  x = Integer(x);

  return x;
}
```

**`maybe` combinator**

```js
function foo(x: ?t.String) {
  return x;
}

// compiles to
function foo(x: ?t.String) {
  x = t.maybe(t.String)(x);

  return x;
}
```

**`list` combinator**

```js
function foo(x: Array<t.String>) {
  return x;
}

// compiles to
function foo(x: Array<t.String>) {
  x = t.list(t.String)(x);

  return x;
}
```

**`tuple` combinator**

```js
function foo(x: [t.String, t.Number]) {
  return x;
}

// compiles to
function foo(x: [t.String, t.Number]) {
  x = t.tuple([t.String, t.Number])(x);

  return x;
}
```

**`union` combinator**

```js
function foo(x: t.String | t.Number) {
  return x;
}

// compiles to
function foo(x: t.String | t.Number) {
  x = t.union([t.String, t.Number])(x);

  return x;
}
```

**`dict` combinator**

```js
function foo(x: {[key: t.String]: t.Number}) {
  return x;
}

// compiles to
function foo(x: { [key: t.String]: t.Number }) {
  x = t.dict(t.String, t.Number)(x);

  return x;
}
```

**`intersection` combinator**

```js
function foo(x: t.Number & t.String) {
  return x;
}

// compiles to
function foo(x: t.Number & t.String) {
  x = t.intersection([t.Number, t.String])(x);

  return x;
}
```

**Arrow functions**

```js
const f = (x: t.String) => x;

// compiles to
const f = x => {
  x = t.String(x);
  return x;
};
```

**Classes**

```js
class A {
  foo(x: t.String): t.String {
    return x;
  }
}

// compiles to
class A {
  foo(x: t.String): t.String {
    x = t.String(x);

    const ret = function (x) {
      return x;
    }(x);

    return t.String(ret);
  }
}
```
