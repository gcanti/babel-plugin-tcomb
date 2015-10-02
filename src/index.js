const tcombLibraries = {
  'tcomb': 1,
  'tcomb-validation': 1,
  'tcomb-react': 1,
  'tcomb-form': 1
};

export default function ({ Plugin, types: t }) {

  let tcomb = t.identifier('t');

  const list = t.identifier('list');
  const maybe = t.identifier('maybe');
  const tuple = t.identifier('tuple');
  const union = t.identifier('union');
  const intersection = t.identifier('intersection');
  const dict = t.identifier('dict');

  function getExpressionFromGenericTypeAnnotation(id) {
    if (id.type === 'QualifiedTypeIdentifier') {
      return t.memberExpression(getExpressionFromGenericTypeAnnotation(id.qualification), t.identifier(id.id.name));
    }
    return t.identifier(id.name);
  }

  function getList(node) {
    return t.callExpression(
      t.memberExpression(tcomb, list),
      [getType(node)]
    );
  }

  function getMaybe(node) {
    return t.callExpression(
      t.memberExpression(tcomb, maybe),
      [getType(node)]
    );
  }

  function getTuple(nodes) {
    return t.callExpression(
      t.memberExpression(tcomb, tuple),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getUnion(nodes) {
    return t.callExpression(
      t.memberExpression(tcomb, union),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getDict(key, value) {
    return t.callExpression(
      t.memberExpression(tcomb, dict),
      [getType(key), getType(value)]
    );
  }

  function getIntersection(nodes) {
    return t.callExpression(
      t.memberExpression(tcomb, intersection),
      [t.arrayExpression(nodes.map(getType))]
    );
  }

  function getType(annotation) {
    switch (annotation.type) {

      case 'GenericTypeAnnotation' :
        if (annotation.id.name === 'Array') {
          return getList(annotation.typeParameters.params[0]);
        }
        return getExpressionFromGenericTypeAnnotation(annotation.id);

      case 'ArrayTypeAnnotation' :
        return getList(annotation.elementType);

      case 'NullableTypeAnnotation' :
        return getMaybe(annotation.typeAnnotation);

      case 'TupleTypeAnnotation' :
        return getTuple(annotation.types);

      case 'UnionTypeAnnotation' :
        return getUnion(annotation.types);

      case 'ObjectTypeAnnotation' :
        return getDict(annotation.indexers[0].key, annotation.indexers[0].value);

      case 'IntersectionTypeAnnotation' :
        return getIntersection(annotation.types);

      default :
        throw new SyntaxError(`Unsupported type annotation: ${annotation.type}`);
    }
  }

  function getFunctionArgumentChecks(node) {
    return node.params.filter((param) => param.typeAnnotation).map((param, i) => {
      const id = t.identifier(param.name);
      return t.expressionStatement(
        t.assignmentExpression(
          '=',
          id,
          t.callExpression(
            getType(param.typeAnnotation.typeAnnotation),
            [id]
          )
        )
      );
    })
  }

  function getFunctionReturnTypeCheck(node) {
    const params = node.params.map((param) => t.identifier(param.name));
    const id = t.identifier('ret');

    const body = node.type === 'ArrowFunctionExpression' && node.expression ?
      t.blockStatement([t.returnStatement(node.body)]) :
      node.body;

    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          id,
          t.callExpression(
            t.functionDeclaration(null, params, body),
            params
          )
        )
      ]),
      t.returnStatement(
        t.callExpression(
          getType(node.returnType.typeAnnotation),
          [id]
        )
      )
    ];
  }

  function getTcomb(node) {
    if (tcombLibraries.hasOwnProperty(node.source.value)) {
      for (let i = 0, len = node.specifiers.length ; i < len ; i++) {
        if (node.specifiers[i].type === 'ImportDefaultSpecifier') {
          return t.identifier(node.specifiers[i].local.name);
        }
      }
    }
  }

  return new Plugin('tcomb', {
    visitor: {

      ImportDeclaration: {
        exit(node) {
          tcomb = getTcomb(node);
        }
      },

      Function: {
        exit(node) {
          try {

            const body = getFunctionArgumentChecks(node);
            if (node.returnType) {
              body.push(...getFunctionReturnTypeCheck(node));
            }
            else {
              if (node.type === 'ArrowFunctionExpression' && node.expression) {
                body.push(t.returnStatement(node.body));
              }
              else {
                body.push(...node.body.body);
              }
            }

            let ret;
            if (node.type === 'FunctionDeclaration') {
              ret = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
            }
            else if (node.type === 'FunctionExpression') {
              ret = t.functionExpression(node.id, node.params, t.blockStatement(body));
            }
            else if (node.type === 'ArrowFunctionExpression') {
              ret = t.arrowFunctionExpression(node.params, t.blockStatement(body), false);
            }

            ret.returnType = node.returnType;

            return ret;
          }
          catch (e) {
            if (e instanceof SyntaxError) {
              throw this.errorWithNode(e.message);
            }
            else {
              throw e;
            }
          }
        }
      }
    }
  });
}
