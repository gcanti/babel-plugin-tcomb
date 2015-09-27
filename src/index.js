const NAME = '_t';

function getQualifiedTypeIdentifier(id) {
  if (id.type === 'QualifiedTypeIdentifier') {
    return getQualifiedTypeIdentifier(id.qualification) + '.' + id.id.name;
  }
  return id.name;
}

function hasTypeAnnotation(x) {
  return x.typeAnnotation;
}

export default function ({ Plugin, types: t }) {

  function getType(annotation) {
    const typeAnnotation = annotation.typeAnnotation;
    switch (typeAnnotation.type) {
      case 'GenericTypeAnnotation' :
        return t.identifier(getQualifiedTypeIdentifier(typeAnnotation.id));
    }
    return 'Unknown';
  }

  return new Plugin('tcomb', {
    visitor: {

      Function: {
        exit(node, parent) {
          const ret = t.identifier('ret');
          const params = node.params.map((param) => t.identifier(param.name));
          // type check the arguments
          const body = node.params.map((param, i) => {
            if (hasTypeAnnotation(param)) {
              return t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  params[i],
                  t.callExpression(
                    getType(param.typeAnnotation),
                    [params[i]]
                  )
                )
              );
            }
          });
          if (node.returnType) {
            // call original function and store the return value in the ret variable
            body.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  ret,
                  t.callExpression(
                    t.functionDeclaration(null, params, node.body),
                    params
                  )
                )
              ])
            );
            // type check the return value
            body.push(
              t.returnStatement(
                t.callExpression(
                  getType(node.returnType),
                  [ret]
                )
              )
            );
          }
          else {
            body.push(...node.body.body);
          }
          const f = t.functionDeclaration(node.id, node.params, t.blockStatement(body));
          f.returnType = node.returnType;
          return f;
        }
      }
    }
  });
}
