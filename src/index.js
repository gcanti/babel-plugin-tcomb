const tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1,
  'redux-tcomb': 1
}

const INTERFACE_NAME = 'interface'

export default function ({ types: t }) {

  let tcombLocalName = null

  function ensureTcombLocalName() {
    if (!tcombLocalName) {
      tcombLocalName = t.callExpression(
        t.identifier('require'),
        [t.StringLiteral('tcomb')]
      )
    }
  }

  function getTcombLocalNameFromImports(node) {
    for (let i = 0, len = node.specifiers.length; i < len; i++) {
      const specifier = node.specifiers[i]
      const found = ( specifier.type === 'ImportSpecifier' && specifier.imported.name === 't' ) || specifier.type === 'ImportDefaultSpecifier'
      if (found) {
        return t.identifier(specifier.local.name)
      }
    }
  }

  function isObjectPattern(node) {
    return node.type === 'ObjectPattern'
  }

  function getTcombLocalNameFromRequires(node) {
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

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name))
    }
    return t.identifier(id.name)
  }

  function addTypeName(args, name) {
    if (typeof name === 'object') {
      args.push(name)
    }
    return args
  }

  function getListCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('list')),
      addTypeName([type], name)
    )
  }

  function getMaybeCombinator(type, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('maybe')),
      addTypeName([type], name)
    )
  }

  function getTupleCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('tuple')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getUnionCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('union')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getEnumsCombinator(enums, name) {
    return t.callExpression(
      t.memberExpression(t.memberExpression(tcombLocalName, t.identifier('enums')), t.identifier('of')),
      addTypeName([t.arrayExpression(enums.map(e => t.stringLiteral(e)))], name)
    )
  }

  function getDictCombinator(domain, codomain, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('dict')),
      addTypeName([domain, codomain], name)
    )
  }

  function getIntersectionCombinator(types, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('intersection')),
      addTypeName([t.arrayExpression(types)], name)
    )
  }

  function getFuncCombinator(domain, codomain, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('func')),
      addTypeName([t.arrayExpression(domain), codomain], name)
    )
  }

  function getObjectExpression(properties) {
    const props = properties
      .map(prop => {
        const name = t.identifier(prop.key.name)
        let type = getType(prop.value)
        if (prop.optional) {
          type = getMaybeCombinator(type)
        }
        return t.objectProperty(name, type)
      })
    return t.objectExpression(props)
  }

  function getInterfaceCombinator(annotation, name) {
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier(INTERFACE_NAME)),
      addTypeName([getObjectExpression(annotation.properties)], name)
    )
  }

  //
  // Flow types
  //

  function getNumberType() {
    return t.memberExpression(tcombLocalName, t.identifier('Number'))
  }

  function getStringType() {
    return t.memberExpression(tcombLocalName, t.identifier('String'))
  }

  function getBooleanType() {
    return t.memberExpression(tcombLocalName, t.identifier('Boolean'))
  }

  function getVoidType() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'))
  }

  function getNullType() {
    return t.memberExpression(tcombLocalName, t.identifier('Nil'))
  }

  function getAnyType() {
    return t.memberExpression(tcombLocalName, t.identifier('Any'))
  }

  function getNumericLiteralType(value) {
    const n = t.identifier('n')
    return t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('refinement')),
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

  function getType(annotation, name) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        if (annotation.id.name === 'Array') {
          if (!annotation.typeParameters || annotation.typeParameters.params.length !== 1) {
            // TODO(giu) what's this?
            throw new SyntaxError(`Unsupported Array type annotation`)
          }
          return getListCombinator(getType(annotation.typeParameters.params[0]), name)
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id)

      case 'ArrayTypeAnnotation' :
        return getListCombinator(getType(annotation.elementType), name)

      case 'NullableTypeAnnotation' :
        return getMaybeCombinator(getType(annotation.typeAnnotation), name)

      case 'TupleTypeAnnotation' :
        return getTupleCombinator(annotation.types.map(getType), name)

      case 'UnionTypeAnnotation' :
        // handle enums
        if (annotation.types.every(n => n.type === 'StringLiteralTypeAnnotation')) {
          return getEnumsCombinator(annotation.types.map(n => n.value), name)
        }
        return getUnionCombinator(annotation.types.map(getType), name)

      case 'ObjectTypeAnnotation' :
        if (annotation.indexers.length === 1) {
          return getDictCombinator(getType(annotation.indexers[0].key), getType(annotation.indexers[0].value), name)
        }
        return getInterfaceCombinator(annotation, name)

      case 'IntersectionTypeAnnotation' :
        return getIntersectionCombinator(annotation.types.map(getType), name)

      case 'FunctionTypeAnnotation' :
        return getFuncCombinator(annotation.params.map((param) => getType(param.typeAnnotation)), getType(annotation.returnType), name)

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
        throw new SyntaxError(`Unsupported type annotation: ${annotation.type}`)
    }
  }

  function getAssertForRequiredType({ id, type }) {
    const guard = t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('is')),
      [id, type]
    )
    const message = t.binaryExpression(
      '+',
      t.binaryExpression(
        '+',
        t.stringLiteral('Invalid argument ' + id.name + ' (expected a '),
        t.callExpression(t.memberExpression(tcombLocalName, t.identifier('getTypeName')), [type])
      ),
      t.stringLiteral(')')
    )
    const assert = t.callExpression(
      t.memberExpression(tcombLocalName, t.identifier('assert')),
      [guard, message]
    )
    return t.expressionStatement(assert)
  }

  function getAssert({ name, optional, typeAnnotation }) {
    let type = getType(typeAnnotation)
    if (optional) {
      type = getMaybeCombinator(type)
    }
    return getAssertForRequiredType({ id: t.identifier(name), type })
  }

  function getFunctionArgumentCheckExpressions(node) {
    const params = []

    node.params.forEach((param, i) => {
      if (param.type === 'AssignmentPattern') {
        if (param.left.typeAnnotation) {
          params.push({
            name: param.left.name,
            optional: param.optional,
            typeAnnotation: param.left.typeAnnotation.typeAnnotation
          })
        }
        else if (param.typeAnnotation) {
          params.push({
            name: param.left.name,
            optional: param.optional,
            typeAnnotation: param.typeAnnotation.typeAnnotation
          })
        }
      }
      else if (param.typeAnnotation) {
        params.push({
          name: isObjectPattern(param) ? 'arguments[' + i + ']' : param.name,
          optional: param.optional,
          typeAnnotation: param.typeAnnotation.typeAnnotation
        })
      }
    })

    if (params.length > 0) {
      ensureTcombLocalName()
    }

    return params.map(getAssert)
  }

  function getWrappedFunctionReturnWithTypeCheck(node) {
    const params = node.params.map(param => {
      if (isObjectPattern(param)) {
        return param
      }
      else if (param.type === 'AssignmentPattern') {
        return param.left
      }
      return t.identifier(param.name)
    })
    const callParams = params.map(param => {
      if (isObjectPattern(param)) {
        return t.objectExpression(param.properties)
      }
      return param
    })

    const name = 'ret'
    const id = t.identifier(name)

    const assert = getAssert({
      name,
      typeAnnotation: node.returnType.typeAnnotation
    })

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

  function getTypeAliasDefinition(node) {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        node.id,
        getType(node.right, t.stringLiteral(node.id.name))
      )
    ])
  }

  function getInterfaceDefinition(node) {
    const name = t.stringLiteral(node.id.name)
    if (node.extends.length === 0) {
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          node.id,
          getType(node.body, name)
        )
      ])
    }
    else {
      // handle extends
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          node.id,
          t.callExpression(
            t.memberExpression(t.memberExpression(tcombLocalName, t.identifier(INTERFACE_NAME)), t.identifier('extend')),
            [
              t.arrayExpression(node.extends.map(inter => inter.id).concat(getObjectExpression(node.body.properties))),
              name
            ]
          )
        )
      ])
    }
  }

  //
  // visitors
  //

  return {
    visitor: {
      Program: {
        enter() {
          // Ensure we reset the import between each file so that our guard
          // of the import works correctly.
          tcombLocalName = null
        }
      },

      ImportDeclaration(path) {
        const { node } = path
        if (!tcombLocalName && tcombLibraries.hasOwnProperty(node.source.value)) {
          tcombLocalName = getTcombLocalNameFromImports(node)
        }
        if (node.importKind === 'type') {
          path.replaceWith(
            t.importDeclaration(node.specifiers, node.source)
          )
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
          tcombLocalName = getTcombLocalNameFromRequires(node)
        }
      },

      TypeAlias(path) {
        ensureTcombLocalName()
        path.replaceWith(getTypeAliasDefinition(path.node))
      },

      InterfaceDeclaration(path) {
        ensureTcombLocalName()
        path.replaceWith(getInterfaceDefinition(path.node))
      },

      Function(path, state) {
        if (state.opts['strip-asserts']) {
          return
        }

        const { node } = path

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
            ensureTcombLocalName()

            const funcBody = path.get('body')

            funcBody.replaceWithMultiple(
              getWrappedFunctionReturnWithTypeCheck(node)
            )
          }

          // Prepend any argument checks to the top of our function body.
          const argumentChecks = getFunctionArgumentCheckExpressions(node)
          if (argumentChecks.length > 0) {
            node.body.body.unshift(...argumentChecks)
          }
        }
        catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error('[babel-plugin-tcomb] ' + e.message)
          }
          else {
            throw e
          }
        }
      }
    }
  }
}
