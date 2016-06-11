const PLUGIN_NAME = 'babel-plugin-tcomb'
const INTERFACE_COMBINATOR_NAME = 'interface'

//
// plugin magic types
//

const MAGIC_REFINEMENT_NAME = '$Refinement'
const MAGIC_REIFY_NAME = '$Reify'

const RESERVED_NAMES = {
  [MAGIC_REFINEMENT_NAME]: true,
  [MAGIC_REIFY_NAME]: true
}

//
// plugin config
//

// useful for tests
const SKIP_HELPERS_OPTION = 'skipHelpers'
// useful for keeping the models
const SKIP_ASSERTS_OPTION = 'skipAsserts'

export default function ({ types: t, template }) {

  let tcombExpression = null
  let assertHelperName = null
  let hasTypes = false
  let hasAsserts = false

  const assertHelper = expression(`
    function assert(x, type, name) {
      type = type || tcomb.Any;
      if (tcomb.isType(type) && type.meta.kind !== 'struct') {
        type(x, [name + ': ' + tcomb.getTypeName(type)]);
      } else if (!(x instanceof type)) {
        tcomb.fail('Invalid value ' + tcomb.stringify(x) + ' supplied to ' + name + ' (expected a ' + tcomb.getTypeName(type) + ')');
      }
      return x;
    }
  `)

  const genericsHelper = expression('typeof type !== "undefined" ? type : tcomb.Any')

  //
  // combinators
  //

  function getListCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('list')),
      addTypeName([type], name)
    )
  }

  function getMaybeCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('maybe')),
      addTypeName([type], name)
    )
  }

  function getTupleCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('tuple')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getUnionCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('union')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombExpression, t.identifier('enums')), t.identifier('of')),
      addTypeName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    )
  }

  function getDictCombinator(domain, codomain, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('dict')),
      addTypeName([domain, codomain], name)
    )
  }

  function getRefinementCombinator(type, predicate, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('refinement')),
      addTypeName([type, predicate], name)
    )
  }

  function getIntersectionCombinator(types, name) {
    const intersections = types.filter(t => !(t._refinementPredicateId))
    const refinements = types.filter(t => t._refinementPredicateId)
    let intersection = intersections.length > 1 ?
      t.callExpression(
        t.memberExpression(tcombExpression, t.identifier('intersection')),
        addTypeName([t.arrayExpression(intersections)], name)
      ) :
      intersections[0]
    const len = refinements.length
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        intersection = getRefinementCombinator(intersection, refinements[i]._refinementPredicateId, name)
      }
    }
    return intersection
  }

  function getInterfaceCombinator(props, name) {
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier(INTERFACE_COMBINATOR_NAME)),
      addTypeName([props], name)
    )
  }

  //
  // Flow types
  //

  function getFunctionType() {
    return t.memberExpression(tcombExpression, t.identifier('Function'))
  }

  function getObjectType() {
    return t.memberExpression(tcombExpression, t.identifier('Object'))
  }

  function getNumberType() {
    return t.memberExpression(tcombExpression, t.identifier('Number'))
  }

  function getStringType() {
    return t.memberExpression(tcombExpression, t.identifier('String'))
  }

  function getBooleanType() {
    return t.memberExpression(tcombExpression, t.identifier('Boolean'))
  }

  function getVoidType() {
    return t.memberExpression(tcombExpression, t.identifier('Nil'))
  }

  function getNullType() {
    return t.memberExpression(tcombExpression, t.identifier('Nil'))
  }

  function getAnyType() {
    return t.memberExpression(tcombExpression, t.identifier('Any'))
  }

  function getNumericLiteralType(value) {
    const n = t.identifier('n')
    return t.callExpression(
      t.memberExpression(tcombExpression, t.identifier('refinement')),
      [
        getNumberType(),
        t.functionExpression(null, [n], t.blockStatement([
          t.returnStatement(
            t.binaryExpression(
              '===',
              n,
              t.numericLiteral(value)
            )
          )
        ]))
      ]
    )
  }

  //
  // helpers
  //

  function getExpression (node) {
    return t.isExpressionStatement(node) ? node.expression : node
  }

  function expression (input) {
    const fn = template(input)
    return function (args) {
      const node = fn(args)
      return getExpression(node)
    }
  }

  function addTypeName(args, name) {
    if (typeof name === 'object') {
      args.push(name)
    }
    return args
  }

  function getObjectExpression(properties, typeParameters) {
    const props = properties
      .map(prop => {
        const name = t.identifier(prop.key.name)
        let type = getType({ annotation: prop.value, typeParameters })
        if (prop.optional) {
          type = getMaybeCombinator(type)
        }
        return t.objectProperty(name, type)
      })
    return t.objectExpression(props)
  }

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name))
    }
    return id
  }

  function getRefinementPredicateId(annotation) {
    if (annotation.typeParameters.params.length !== 1 || !annotation.typeParameters.params[0].argument) {
      throw new Error(`Invalid refinement definition, example: Refinement<typeof predicate>`)
    }
    return getExpressionFromGenericTypeAnnotation(annotation.typeParameters.params[0].argument.id)
  }

  function isTypeParameter(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name)
  }

  function shouldReturnAnyType(typeParameters, name) {
    return isTypeParameter(name, typeParameters) // this plugin doesn't handle generics by design
      // Flow magic types
      || name === '$Shape'
      || name === '$Keys'
      || name === '$Diff'
  }

  function getGenericTypeAnnotation({ annotation, typeName, typeParameters }) {
    const name = annotation.id.name
    if (name === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error(`Unsupported Array type annotation: incorrect number of type parameters (expected 1)`)
      }
      const typeParameter = annotation.typeParameters.params[0]
      return getListCombinator(getType({ annotation: typeParameter, typeParameters }), typeName)
    }
    if (name === 'Function') {
      return getFunctionType()
    }
    if (name === 'Object') {
      return getObjectType()
    }
    if (shouldReturnAnyType(typeParameters, name)) {
      return getAnyType()
    }
    const gta = getExpressionFromGenericTypeAnnotation(annotation.id)
    if (name === MAGIC_REFINEMENT_NAME) {
      gta._refinementPredicateId = getRefinementPredicateId(annotation)
    }
    return gta
  }

  function getType({ annotation, typeName, typeParameters }) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        return getGenericTypeAnnotation({ annotation, typeName, typeParameters })

      case 'ArrayTypeAnnotation' :
        return getListCombinator(getType({ annotation: annotation.elementType, typeParameters }), typeName)

      case 'NullableTypeAnnotation' :
        return getMaybeCombinator(getType({ annotation: annotation.typeAnnotation, typeParameters }), typeName)

      case 'TupleTypeAnnotation' :
        return getTupleCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'UnionTypeAnnotation' :
        // handle enums
        if (annotation.types.every(n => n.type === 'StringLiteralTypeAnnotation')) {
          return getEnumsCombinator(annotation.types.map(n => n.value), typeName)
        }
        return getUnionCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDictCombinator(
            getType({ annotation: annotation.indexers[0].key, typeParameters }),
            getType({ annotation: annotation.indexers[0].value, typeParameters }),
            typeName
          )
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), typeName)

      case 'IntersectionTypeAnnotation' :
        return getIntersectionCombinator(annotation.types.map(annotation => getType({ annotation, typeParameters })), typeName)

      case 'FunctionTypeAnnotation' :
        return getFunctionType()
        // return getFuncCombinator(annotation.params.map((param) => getType(param.typeAnnotation)), getType(annotation.returnType), typeName)

      case 'NumberTypeAnnotation' :
        return getNumberType()

      case 'StringTypeAnnotation' :
        return getStringType()

      case 'BooleanTypeAnnotation' :
        return getBooleanType()

      case 'VoidTypeAnnotation' :
        return getVoidType()

      case 'NullLiteralTypeAnnotation' :
        return getNullType()

      case 'AnyTypeAnnotation' :
      case 'MixedTypeAnnotation' :
        return getAnyType()

      case 'StringLiteralTypeAnnotation' :
        return getEnumsCombinator([annotation.value], typeName)

      case 'NumericLiteralTypeAnnotation' :
        return getNumericLiteralType(annotation.value, typeName)

      default :
        throw new Error(`Unsupported type annotation: ${annotation.type}`)
    }
  }

  function getArgumentName(id) {
    if (id.type === 'MemberExpression') {
      return `${getArgumentName(id.object)}.${id.property.name}`
    }
    return id.name
  }

  function getAssert({ id, optional, annotation, name }, typeParameters) {
    hasAsserts = true
    let type = getType({ annotation, typeParameters })
    if (optional) {
      type = getMaybeCombinator(type)
    }
    name = name || t.stringLiteral(getArgumentName(id))
    if (type.type === 'Identifier') {
      type = genericsHelper({ tcomb: tcombExpression, type })
    }
    return t.expressionStatement(t.callExpression(
      assertHelperName,
      [id, type, name]
    ))
  }

  function isObjectPattern(node) {
    return node.type === 'ObjectPattern'
  }

  function getParam(param, i) {
    if (param.type === 'AssignmentPattern' && param.left.typeAnnotation) {
      return getParam(param.left, i)
    }
    else if (param.typeAnnotation) {
      if (param.type === 'RestElement') {
        return {
          id: param.argument,
          optional: param.optional,
          annotation: param.typeAnnotation.typeAnnotation
        }
      }
      return {
        id: t.identifier(isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
        optional: param.optional,
        annotation: param.typeAnnotation.typeAnnotation
      }
    }
  }

  function getFunctionArgumentCheckExpressions(node, typeParameters) {
    const params = node.params.map(getParam).filter(x => x)
    return params.map(param => getAssert(param, typeParameters))
  }

  function getParamName(param) {
    if (param.type === 'AssignmentPattern') {
      return getParamName(param.left)
    }
    else if (param.type === 'RestElement') {
      return t.restElement(param.argument)
    }
    else if (isObjectPattern(param)) {
      return param
    }
    return t.identifier(param.name)
  }

  function getWrappedFunctionReturnWithTypeCheck(node, typeParameters) {
    const params = node.params.map(getParamName)
    const callParams = params.map(param => {
      if (isObjectPattern(param)) {
        return t.objectExpression(param.properties)
      }
      else if (param.type === 'RestElement') {
        return t.spreadElement(param.argument)
      }
      return param
    })

    const id = t.identifier('ret')

    const assert = getAssert({
      id,
      annotation: node.returnType.typeAnnotation,
      name: t.stringLiteral('return value')
    }, typeParameters)

    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.memberExpression(t.functionExpression(null, params, node.body), t.identifier('call')),
            [t.identifier('this')].concat(callParams)
          )
        )
      ]),
      assert,
      t.returnStatement(id)
    ]
  }

  function getTypeParameters(path) {
    if (path) {
      const node = path.node
      let typeParameters = getTypeParameters(path.parentPath)
      if (node.typeParameters) {
        typeParameters = typeParameters || {}
        node.typeParameters.params.forEach(param => typeParameters[param.name] = true)
      }
      return typeParameters
    }
  }

  function getTypeAliasDefinition(path) {
    const node = path.node
    const typeParameters = getTypeParameters(path)
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        node.id,
        getType({
          annotation: node.right,
          typeName: t.stringLiteral(node.id.name),
          typeParameters
        })
      )
    ])
  }

  function getInterfaceDefinition(path) {
    const node = path.node
    const typeParameters = getTypeParameters(path)
    const typeName = t.stringLiteral(node.id.name)
    if (node.extends.length === 0) {
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          node.id,
          getType({
            annotation: node.body,
            typeName,
            typeParameters
          })
        )
      ])
    }
    else {
      // handle extends
      let props = getObjectExpression(node.body.properties)
      const mixins = node.extends.filter(m => m.id.name !== MAGIC_REFINEMENT_NAME)
      const refinements = node.extends.filter(m => m.id.name === MAGIC_REFINEMENT_NAME)
      const len = refinements.length
      if (len > 0) {
        props = getInterfaceCombinator(props)
        for (let i = 0; i < len; i++) {
          props = getRefinementCombinator(props, getRefinementPredicateId(refinements[i]))
        }
      }
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          node.id,
          t.callExpression(
            t.memberExpression(t.memberExpression(tcombExpression, t.identifier(INTERFACE_COMBINATOR_NAME)), t.identifier('extend')),
            [
              t.arrayExpression(mixins.map(inter => inter.id).concat(props)),
              typeName
            ]
          )
        )
      ])
    }
  }

  function buildCodeFrameError(path, error) {
    throw path.buildCodeFrameError(`[${PLUGIN_NAME}] ${error.message}`)
  }

  function preventReservedNameUsage(path) {
    const name = path.node.id.name
    if (name in RESERVED_NAMES) {
      buildCodeFrameError(path, new Error(`${name} is a reserved interface name for ${PLUGIN_NAME}`))
    }
  }

  //
  // visitors
  //

  return {
    visitor: {

      Program: {
        enter(path) {
          tcombExpression = path.scope.generateUidIdentifier('t')
          hasAsserts = false
          hasTypes = false
          assertHelperName = path.scope.generateUidIdentifier('assert')
        },
        exit(path, state) {
          const isAssertHelperRequired = hasAsserts && !state.opts[SKIP_ASSERTS_OPTION] && !state.opts[SKIP_HELPERS_OPTION]

          if (hasTypes || isAssertHelperRequired) {
            path.node.body.unshift(t.ImportDeclaration(
              [t.importDefaultSpecifier(tcombExpression)],
              t.stringLiteral('tcomb')
            ))
          }

          if (isAssertHelperRequired) {
            path.node.body.push(assertHelper({
              assert: assertHelperName,
              tcomb: tcombExpression
            }))
          }
        }
      },

      ImportDeclaration(path) {
        const node = path.node
        // prevent transform-flow-strip-types
        if (node.importKind === 'type') {
          node.importKind = 'value'
        }
      },

      ExportNamedDeclaration(path) {
        const node = path.node
        // prevent transform-flow-strip-types
        if (node.declaration && ( node.declaration.type === 'TypeAlias' || node.declaration.type === 'InterfaceDeclaration' ) ) {
          node.exportKind = 'value'
        }
      },

      TypeAlias(path) {
        preventReservedNameUsage(path)
        hasTypes = true
        path.replaceWith(getTypeAliasDefinition(path))
      },

      TypeCastExpression(path) {
        const node = path.node
        // handle runtime type introspection
        if (node.typeAnnotation &&
            node.typeAnnotation.typeAnnotation &&
            node.typeAnnotation.typeAnnotation.id &&
            node.typeAnnotation.typeAnnotation.id.name === MAGIC_REIFY_NAME) {
          try {
            path.replaceWith(node.typeAnnotation.typeAnnotation.typeParameters.params[0].id)
          }
          catch (error) {
            buildCodeFrameError(path, new Error(`Invalid use of ${MAGIC_REIFY_NAME}`))
          }
        }
        else {
          path.replaceWith(getAssert({
            id: node.expression,
            annotation: node.typeAnnotation.typeAnnotation
          }))
        }
      },

      InterfaceDeclaration(path) {
        preventReservedNameUsage(path)
        hasTypes = true
        path.replaceWith(getInterfaceDefinition(path))
      },

      Function(path, state) {
        if (state.opts[SKIP_ASSERTS_OPTION]) {
          return
        }

        const node = path.node

        try {
          // Firstly let's replace arrow function expressions into
          // block statement return structures.
          if (node.type === "ArrowFunctionExpression" && node.expression) {
            node.expression = false
            node.body = t.blockStatement([t.returnStatement(node.body)])
          }

          // If we have a return type then we will wrap our entire function
          // body and insert a type check on the returned value.
          if (node.returnType) {
            path.get('body').replaceWithMultiple(
              getWrappedFunctionReturnWithTypeCheck(node)
            )
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressions(node)
          if (argumentChecks.length > 0) {
            node.body.body.unshift(...argumentChecks)
          }
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      }
    }
  }
}
