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

## v0.2.1

- **New Feature**
  - Functions that had a destructured argument as well as a type checked return would fail transpilation, fix #17 (thanks @ctrlplusb)

## v0.2.0

- **Breaking Change**
    - upgrade to babel ^6.0.0 https://github.com/gcanti/babel-plugin-tcomb/pull/12 (thanks @ctrlplusb)
    - support for default values https://github.com/gcanti/babel-plugin-tcomb/pull/15

## v0.1.4 (babel ^5.0.0)

- **New Feature**
    - support for default values

