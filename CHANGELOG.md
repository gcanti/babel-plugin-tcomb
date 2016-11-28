# Changelog

> **Tags:**
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]
> - [Experimental]

**Note**: Gaps between patch versions are faulty/broken releases.
**Note**: A feature tagged as Experimental is in a high state of flux, you're at risk of it changing without notice.

# v0.3.24

- **New Feature**
  - add `warnOnFailure` plugin option, fix #152 (@gcanti)

# v0.3.23

- **Bug Fix**
  - fix regression with de-structuring and default parameters, fix #148 (@gcanti)

# v0.3.22

- **Bug Fix**
  - arguments object and arrow functions don't play well together, fix #144 (@gcanti)

- **Bug Fix**
  - Assertions on object destructuring, fix #141 (@gcanti)

# v0.3.21

- **Bug Fix**
  - Assertions on object destructuring, fix #141 (@gcanti)

# v0.3.20

- **Internal**
  - remove `require`s from import type declarations, fix #139 (@gcanti)
- **Bug Fix**
  - "keyword"-style args with function defaults that declare return types cause runtime errors, fix #136 (@gcanti)

# v0.3.19

- **Bug Fix**
  - return types on fat-arrow functions lose access to `this`, fix #134 (@gcanti)

# v0.3.18

- **Bug Fix**
  - support default type import shorthand (@STRML)

# v0.3.17

- **Bug Fix**
  - handle destructured "keyword" params with default values and return type, fix #129 (@gcanti)

# v0.3.16

- **Bug Fix**
  - annotated functions now handle exact types, fix #127 (@gcanti)

# v0.3.15

- **New Feature**
  - support exact object syntax (@christophehurpeau)

# v0.3.14

- **New Feature**
  - add support for `$Exact` magic type, fix #121 (@gcanti)

# v0.3.13

- **Bug Fix**
  - Immutability not working, fix #119 (@gcanti)

# v0.3.12

- **Bug Fix**
  - handle 'keyword'-style function arguments, fix #103 (@gcanti)

# v0.3.11

- **Experimental**
  - handle async / await, fix #95 (@gcanti)

# v0.3.10

- **Bug Fix**
  - Support complicated object property name, fix #89 (@gcanti)

# v0.3.9

- **New Feature**
  - add `globals` option, fix #56 (@gcanti)
- **Bug Fix**
  - handle type parameters in casts (@gcanti)

# v0.3.8

- **Bug Fix**
  - allow mutually recursive types, fix #84 (@gcanti)
  - remove babel warning when defining an exported recursive type, fix #82 (@gcanti)

# v0.3.7

- **Bug Fix**
  - ignore superTypeParameters when retrieving class type parameters (@gcanti)

# v0.3.6

- **Bug Fix**
  - handle inner functions using type parameters (@gcanti)

# v0.3.5

- **Bug Fix**
  - avoid detecting relative paths as absolute and replace local with imported, fix #77 (@gcanti, thanks @minedeljkovic)

# v0.3.4

- **New Feature**
  - Add support for Variable declarations (const) (thanks @christophehurpeau)
- **Bug Fix**
  - add support for ExistentialTypeParam, fix #67 (@gcanti)
  - add support for TypeofTypeAnnotation, fix #63 (@gcanti)

# v0.3.3

- **Bug Fix**
  - add support for BooleanLiteralTypeAnnotation, fix #54 (@gcanti)

# v0.3.2

- **Bug Fix**
  - support values in type casts, fix #50 (@gcanti)
- **Internal**
  - add `$Abstract` and `$Subtype` Flow magic types (@gcanti)

## v0.3.1

- **Bug Fix**
  - retrieve type parameters from path recursively, fix #46 (@gcanti)
  - add support for super type parameters (@gcanti)

## v0.3.0

- **Breaking Change**
  - complete refactoring, `tcomb ^3.2.2` is now required
  - add support for Flow syntax

## v0.2.3

- **Bug Fix**
  - broken noop case for default params, fix #31 (@ctrlplusb)
  - Import guarding correctly resets between files (@ctrlplusb)
  - Import guarding now short circuits import searching after the first valid tcomb import instance is resolved. This provides higher efficiency whilst also preventing strange bug cases that could occur (@ctrlplusb)

## v0.2.2

- **New Feature**
  - support alternative format for default param type annotations, fix #18
  - "require" based imports of tcomb libraries now resolve to a `tcombLocalName` (@ctrlplusb)
  - Guarding of tcomb imports, ensuring that tcomb is imported within the scope of any functions that have type checking, fix #21 (@ctrlplusb)
  - add support for object structure type annotations, e.g. `function foo(x : { bob: t.String, baz: t.Number })`, fix #24 (@ctrlplusb)
  - better error messages, fix #25
- **Bug fix**
  - Errors were thrown for functions with default'ed params and a type checked return value, fix #19 (@ctrlplusb)
  - Imports of extended tcomb libraries (e.g. "tcomb-react") now correctly resolve to a `tcombLocalName` (@ctrlplusb)

## v0.2.1

- **Bug fix**
  - Functions that had a destructured argument as well as a type checked return would fail transpilation, fix #16 (@ctrlplusb)

## v0.2.0

- **Breaking Change**
    - upgrade to babel ^6.0.0 https://github.com/gcanti/babel-plugin-tcomb/pull/12 (thanks @ctrlplusb)
    - support for default values https://github.com/gcanti/babel-plugin-tcomb/pull/15

## v0.1.4 (babel ^5.0.0)

- **New Feature**
    - support for default values

