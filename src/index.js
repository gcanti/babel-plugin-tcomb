const tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1,
  'redux-tcomb': 1
}

const PLUGIN_NAME = 'babel-plugin-tcomb'
const INTERFACE_COMBINATOR_NAME = 'interface'
const REFINEMENT_INTERFACE_NAME = '$Refinement'

export default function ({ types: t, template }) {

  let tcombExpression = null
  let assertHelperName = null

  const assertHelper = expression(`
    function assert(x, type, name) {
      if (!type) {
        type = tcomb.Any;
      }
      if (tcomb.isType(type) && type.meta.kind !== 'struct') {
        type(x, [name + ': ' + tcomb.getTypeName(type)]);
      } else if (!(x instanceof type)) {
        tcomb.fail('Invalid value ' + tcomb.stringify(x) + ' supplied to ' + name + ' (expected a ' + tcomb.getTypeName(type) + ')');
      }
      return x;
    }
  `)

  //
  // import helpers
  //

  function ensureTcombExpression() {
    if (!tcombExpression) {
      tcombExpression = t.callExpression(
        t.identifier('require'),
        [t.StringLiteral('tcomb')]
      )
    }
  }

  function getTcombExpressionFromImports(node) {
    for (let i = 0, len = node.specifiers.length; i < len; i++) {
      const specifier = node.specifiers[i]
      const found = ( specifier.type === 'ImportSpecifier' && specifier.imported.name === 't' ) || specifier.type === 'ImportDefaultSpecifier'
      if (found) {
        return t.identifier(specifier.local.name)
      }
    }
  }

  function getTcombExpressionFromRequires(node) {
    const importName = node.init.arguments[0].value

    if (importName === 'tcomb') {
      return t.identifier(node.id.name)
    }
    if (isObjectPattern(node.id)) {
      for (let i = 0, len = node.id.properties.length; i < len; i++) {
        const property = node.id.properties[i]
        if (property.key.name === 't') {
          return t.identifier(property.key.name)
        }
      }
    }
    return t.identifier(node.id.name + '.t')
  }

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

  // function getFuncCombinator(domain, codomain, name) {
  //   return t.callExpression(
  //     t.memberExpression(tcombExpression, t.identifier('func')),
  //     addTypeName([t.arrayExpression(domain), codomain], name)
  //   )
  // }

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

  function isGeneric(name, typeParameters) {
    return typeParameters && typeParameters.hasOwnProperty(name)
  }

  function shouldReturnAnyType(typeParameters, name) {
    return isGeneric(name, typeParameters)
      || name === '$Shape'
      || name === '$Keys'
  }

  function getGenericTypeAnnotation({ annotation, name, typeParameters }) {
    const typeName = annotation.id.name
    if (typeName === 'Array') {
      if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
        throw new Error(`Unsupported Array type annotation: incorrect number of type parameters (expected 1)`)
      }
      const typeParameter = annotation.typeParameters.params[0]
      return getListCombinator(getType({ annotation: typeParameter, typeParameters }), name)
    }
    if (shouldReturnAnyType(typeParameters, typeName)) {
      return getAnyType()
    }
    const gta = getExpressionFromGenericTypeAnnotation(annotation.id)
    if (typeName === REFINEMENT_INTERFACE_NAME) {
      gta._refinementPredicateId = getRefinementPredicateId(annotation)
    }
    return gta
  }

  function getType({ annotation, name, typeParameters }) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        return getGenericTypeAnnotation({ annotation, name, typeParameters })

      case 'ArrayTypeAnnotation' :
        return getListCombinator(getType({ annotation: annotation.elementType, typeParameters }), name)

      case 'NullableTypeAnnotation' :
        return getMaybeCombinator(getType({ annotation: annotation.typeAnnotation, typeParameters }), name)

      case 'TupleTypeAnnotation' :
        return getTupleCombinator(annotation.types.map(type => getType({ annotation: type, typeParameters })), name)

      case 'UnionTypeAnnotation' :
        // handle enums
        if (annotation.types.every(n => n.type === 'StringLiteralTypeAnnotation')) {
          return getEnumsCombinator(annotation.types.map(n => n.value), name)
        }
        return getUnionCombinator(annotation.types.map(type => getType({ annotation: type, typeParameters })), name)

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDictCombinator(
            getType({ annotation: annotation.indexers[0].key, typeParameters }),
            getType({ annotation: annotation.indexers[0].value, typeParameters }),
            name
          )
        }
        return getInterfaceCombinator(getObjectExpression(annotation.properties, typeParameters), name)

      case 'IntersectionTypeAnnotation' :
        return getIntersectionCombinator(annotation.types.map(type => getType({ annotation: type, typeParameters })), name)

      case 'FunctionTypeAnnotation' :
        return getFunctionType()
        // return getFuncCombinator(annotation.params.map((param) => getType(param.typeAnnotation)), getType(annotation.returnType), name)

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
        return getEnumsCombinator([annotation.value], name)

      case 'NumericLiteralTypeAnnotation' :
        return getNumericLiteralType(annotation.value, name)

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

  function getAssert({ id, optional, typeAnnotation, argumentName }, typeParameters) {
    let type = getType({ annotation: typeAnnotation, typeParameters })
    if (optional) {
      type = getMaybeCombinator(type)
    }
    argumentName = argumentName || t.stringLiteral(getArgumentName(id))
    return t.expressionStatement(t.callExpression(
      assertHelperName,
      [id, type, argumentName]
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
          typeAnnotation: param.typeAnnotation.typeAnnotation
        }
      }
      return {
        id: t.identifier(isObjectPattern(param) ? 'arguments[' + i + ']' : param.name),
        optional: param.optional,
        typeAnnotation: param.typeAnnotation.typeAnnotation
      }
    }
  }

  function getFunctionArgumentCheckExpressions(node, typeParameters) {
    const params = node.params.map(getParam).filter(x => x)

    if (params.length > 0) {
      ensureTcombExpression()
    }

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
      typeAnnotation: node.returnType.typeAnnotation,
      argumentName: t.stringLiteral('return value')
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
          name: t.stringLiteral(node.id.name),
          typeParameters
        })
      )
    ])
  }

  function getInterfaceDefinition(path) {
    const node = path.node
    const typeParameters = getTypeParameters(path)
    const name = t.stringLiteral(node.id.name)
    if (node.extends.length === 0) {
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          node.id,
          getType({
            annotation: node.body,
            name,
            typeParameters
          })
        )
      ])
    }
    else {
      // handle extends
      let props = getObjectExpression(node.body.properties)
      const mixins = node.extends.filter(m => m.id.name !== REFINEMENT_INTERFACE_NAME)
      const refinements = node.extends.filter(m => m.id.name === REFINEMENT_INTERFACE_NAME)
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
              name
            ]
          )
        )
      ])
    }
  }

  function buildCodeFrameError(path, error) {
    throw path.buildCodeFrameError(`[${PLUGIN_NAME}] ${error.message}`)
  }

  function preventReservedInterfaceNameUsage(path) {
    if (path.node.id.name === REFINEMENT_INTERFACE_NAME) {
      buildCodeFrameError(path, new Error(`${REFINEMENT_INTERFACE_NAME} is a reserved interface name for ${PLUGIN_NAME}`))
    }
  }

  //
  // visitors
  //

  return {
    visitor: {

      Program: {
        enter(path) {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombExpression = null
          assertHelperName = path.scope.generateUidIdentifier('assert')
        },
        exit(path, state) {
          if (state.opts['skipHelpers'] || state.opts['skipAsserts']) {
            return
          }
          ensureTcombExpression()
          path.node.body.unshift(assertHelper({
            assert: assertHelperName,
            tcomb: tcombExpression
          }))
        }
      },

      ImportDeclaration(path) {
        const { node } = path
        if (!tcombExpression && tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombExpression = getTcombExpressionFromImports(node)
        }
      },

      VariableDeclarator({ node }) {
        if (node.init && node.init.type &&
            node.init.type === 'CallExpression' &&
            node.init.callee.name === 'require' &&
            node.init.arguments &&
            node.init.arguments.length > 0 &&
            node.init.arguments[0].type === 'StringLiteral' &&
            tcombLibraries.hasOwnProperty(node.init.arguments[0].value)) {
          tcombExpression = getTcombExpressionFromRequires(node)
        }
      },

      TypeAlias(path) {
        preventReservedInterfaceNameUsage(path)
        ensureTcombExpression()
        try {
          path.replaceWith(getTypeAliasDefinition(path))
        }
        catch (error) {
          buildCodeFrameError(path, error)
        }
      },

      TypeCastExpression(path) {
        const { node } = path
        path.replaceWith(getAssert({
          id: node.expression,
          typeAnnotation: node.typeAnnotation.typeAnnotation
        }))
      },

      InterfaceDeclaration(path) {
        preventReservedInterfaceNameUsage(path)
        ensureTcombExpression()
        path.replaceWith(getInterfaceDefinition(path))
      },

      Function(path, state) {
        if (state.opts['skipAsserts']) {
          return
        }

        const { node } = path
        const typeParameters = getTypeParameters(path)

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
            ensureTcombExpression()
            path.get('body').replaceWithMultiple(
              getWrappedFunctionReturnWithTypeCheck(node, typeParameters)
            )
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressions(node, typeParameters)
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
