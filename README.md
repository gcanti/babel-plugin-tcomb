Babel plugin for static and runtime type checking using Flow and tcomb.

**Tools**

[Flow](https://flowtype.org/) is a static type checker for JavaScript.

[tcomb](https://github.com/gcanti/tcomb) is a library for Node.js and the browser which allows you to check the types of JavaScript values at runtime with a simple and concise syntax. It's great for Domain Driven Design and for adding safety to your internal code.

# Why?

**Runtime type checking (tcomb)**

- you don't want or you can't use `Flow`
- you want refinement types
- you want to validate the IO boundary (for example API payloads)
- you want to enforce immutability
- you want to leverage the runtime type introspection provided by `tcomb`'s types

**Static type checking (Flow)**

`babel-plugin-tcomb` is `Flow` compatible, this means that you can run them side by side, statically checking your code with `Flow` and let `tcomb` catching the remaining bugs at runtime.

# Gentle migration path

You can add type safety to your untyped codebase gradually:

- first, add type annotations where you think they are most useful, file by file, leveraging the runtime type safety provided by `tcomb`
- then, when you feel comfortable, turn on `Flow` and unleash the power of static type checking
- third, for even more type safety, define your refinement types and validate the IO boundary

# Fork

[Here](https://github.com/christophehurpeau/babel-plugin-tcomb) you can find a fork of this plugin that provides the following additional features:

- Avoid checks on confident assignment
- Bounded polymorphism partial support
- `let` checks
- Assignment type checking

# Setup

First, install via npm.

```sh
npm install --save-dev tcomb
npm install --save-dev babel-plugin-tcomb
```

Then, in your babel configuration (usually in your `.babelrc` file), add (at least) the following plugins:

```js
{
  "plugins" : [
    "syntax-flow",
    "tcomb",
    "transform-flow-strip-types"
  ]
}
```

**Note**. ``syntax-flow`` and ``transform-flow-strip-types`` are already included with the [React Preset](https://babeljs.io/docs/plugins/preset-react/).

**Note**. Use [Babel's env option](https://babeljs.io/docs/usage/babelrc/) to only use this plugin in development.

**Warning**. If you use multiple presets and are experiencing issues, try tweaking the preset order and setting ``passPerPreset: true``.  Related issues: [#78](https://github.com/gcanti/babel-plugin-tcomb/issues/78) [#99](https://github.com/gcanti/babel-plugin-tcomb/issues/99)

**Important**. `tcomb` must be `require`able

# Plugin configuration

## `skipAsserts?: boolean = false`

Removes the asserts and keeps the domain models

## `warnOnFailure?: boolean = false`

Warns (`console.warn`) about type mismatch instead of throwing an error

## `globals?: Array<Object>`

With this option you can handle global types, like `Class` or react `SyntheticEvent`

Example

```js
"plugins" : [
  ["tcomb", {
    globals: [
      // flow
      {
        'Class': true
      }
      // react
      {
        'SyntheticEvent': true,
        ...
      },
      // your custom global types (if any)
      ...
    ]
  }],
]
```

# Definition files

Definition files for `tcomb` and `tcomb-react` are temporarily published [here](https://github.com/gcanti/pantarei).

# Caveats

- `tcomb` must be `require`able
- type parameters (aka generics) are not handled (`Flow`'s responsability)

# How it works

First, add type annotations.

```js
// index.js

function sum(a: number, b: number) {
  return a + b
}

sum(1, 'a') // <= typo
```

Then run `Flow` (static type checking):

```
index.js:7
  7: sum(1, 'a')
     ^^^^^^^^^^^ function call
  7: sum(1, 'a')
            ^^^ string. This type is incompatible with
  3: function sum(a: number, b: number) {
                                ^^^^^^ number
```

or refresh your browser and look at the console (runtime type checking):

```
Uncaught TypeError: [tcomb] Invalid value "a" supplied to b: Number
```

## Domain models

```js
// index.js

type Person = {
  name: string, // required string
  surname?: string, // optional string
  age: number,
  tags: Array<string>
};

function getFullName(person: Person) {
  return `${person.name} ${person.surname}`
}

getFullName({ surname: 'Canti' })
```

`Flow`:

```
index.js:14
 14: getFullName({
     ^ function call
 10: function getFullName(person: Person) {
                                  ^^^^^^ property `name`. Property not found in
 14: getFullName({
                 ^ object literal
```

`tcomb`:

```
TypeError: [tcomb] Invalid value undefined supplied to person: Person/name: String
```

## Refinements

In order to define [refinement types](https://github.com/gcanti/tcomb/blob/master/docs/API.md#the-refinement-combinator) you can use the `$Refinement` type, providing a predicate identifier:

```js
import type { $Refinement } from 'tcomb'

// define your predicate...
const isInteger = n => n % 1 === 0

// ...and pass it to the suitable intersection type
type Integer = number & $Refinement<typeof isInteger>;

function foo(n: Integer) {
  return n
}

foo(2)   // flow ok, tcomb ok
foo(2.1) // flow ok, tcomb throws [tcomb] Invalid value 2.1 supplied to n: Integer
foo('a') // flow throws, tcomb throws
```

In order to enable this feature add the [`tcomb` definition file](https://github.com/gcanti/pantarei/blob/master/tcomb/3.2.2%2B.js) to the `[libs]` section of your `.flowconfig`.

## Runtime type introspection

Check out the [meta object](https://github.com/gcanti/tcomb/blob/master/docs/API.md#the-meta-object) in the tcomb documentation.

```js
import type { $Reify } from 'tcomb'

type Person = { name: string };

const ReifiedPerson = (({}: any): $Reify<Person>)
console.log(ReifiedPerson.meta) // => { kind: 'interface', props: ... }
```

In order to enable this feature add the [`tcomb` definition file](https://github.com/gcanti/pantarei/blob/master/tcomb/3.2.2%2B.js) to the `[libs]` section of your `.flowconfig`.

## Validating (at runtime) the IO boundary using typecasts

```js
type User = { name: string };

export function loadUser(userId: string): Promise<User> {
  return axios.get('...').then(p => (p: User)) // <= type cast
}
```

## Recursive types

Just add a `// recursive` comment on top:

```js
// recursive
type Path = {
  node: Node,
  parentPath: Path
};
```

# Type-checking Redux

```js
import { createStore } from 'redux'

// types
type State = number;
type ReduxInitAction = { type: '@@redux/INIT' };
type Action = ReduxInitAction
  | { type: 'INCREMENT', delta: number }
  | { type: 'DECREMENT', delta: number };

function reducer(state: State = 0, action: Action): State {
  switch(action.type) {
    case 'INCREMENT' :
      return state + action.delta
    case 'DECREMENT' :
      return state - action.delta
  }
  return state
}

type Store = {
  dispatch: (action: Action) => any;
};

const store: Store = createStore(reducer)

store.dispatch({ type: 'INCREMEN', delta: 1 }) // <= typo

// throws [tcomb] Invalid value { "type": "INCREMEN", "delta": 1 } supplied to action: Action
// Flow throws as well
```

# Type-checking React using tcomb-react

See [tcomb-react](https://github.com/gcanti/tcomb-react):

```js
// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { props } from 'tcomb-react'

type Props = {
  name: string
};

@props(Props)
class Hello extends React.Component<void, Props, void> {
  render() {
    return <div>Hello {this.props.name}</div>
  }
}


ReactDOM.render(<Hello />, document.getElementById('app'))
```

`Flow` will throw:

```
index.js:12
 12: class Hello extends React.Component<void, Props, void> {
                                               ^^^^^ property `name`. Property not found in
 19: ReactDOM.render(<Hello />, document.getElementById('app'))
                     ^^^^^^^^^ props of React element `Hello`
```

while `tcomb-react` will warn:

```
Warning: Failed propType: [tcomb] Invalid prop "name" supplied to Hello, should be a String.

Detected errors (1):

  1. Invalid value undefined supplied to String
```

Additional babel configuration:

```js
{
  "presets": ["react", "es2015"],
  "passPerPreset": true,
  "plugins" : [
    "tcomb",
    "transform-decorators-legacy"
  ]
}
```

In order to enable this feature add the [`tcomb-react` definition file](https://github.com/gcanti/pantarei/blob/master/tcomb-react/0.9.1%2B.js) to the `[libs]` section of your `.flowconfig`.
Also you may want to set `esproposal.decorators=ignore` in the `[options]` section of your `.flowconfig`.

### Without decorators

```js
// @flow

import React from 'react'
import ReactDOM from 'react-dom'
import { propTypes } from 'tcomb-react'
import type { $Reify } from 'tcomb'

type Props = {
  name: string
};

class Hello extends React.Component<void, Props, void> {
  render() {
    return <div>Hello {this.props.name}</div>
  }
}

Hello.propTypes = propTypes((({}: any): $Reify<Props>))

ReactDOM.render(<Hello />, document.getElementById('app'))
```

# Under the hood

## Primitives

```js
type MyString = string;
type MyNumber = number;
type MyBoolean = boolean;
type MyVoid = void;
type MyNull = null;
```

compiles to

```js
import _t from "tcomb";

const MyString = _t.String;
const MyNumber = _t.Number;
const MyBoolean = _t.Boolean;
const MyVoid = _t.Nil;
const MyNull = _t.Nil;
```

## Consts

```js
const x: number = 1
```

compiles to

```js
const x = _assert(x, _t.Number, "x");
```

Note: `let`s are not supported.

## Functions

```js
function sum(a: number, b: number): number {
  return a + b
}
```

compiles to

```js
import _t from "tcomb";

function sum(a, b) {
  _assert(a, _t.Number, "a");
  _assert(b, _t.Number, "b");

  const ret = function (a, b) {
    return a + b;
  }.call(this, a, b);

  _assert(ret, _t.Number, "return value");
  return ret;
}
```

where `_assert` is an helper function injected by `babel-plugin-tcomb`.

## Type aliases

```js
type Person = {
  name: string,
  surname: ?string,
  age: number,
  tags: Array<string>
};
```

compiles to

```js
import _t from "tcomb";

const Person = _t.interface({
  name: _t.String,
  surname: _t.maybe(_t.String),
  age: _t.Number,
  tags: _t.list(_t.String)
}, "Person");
```
