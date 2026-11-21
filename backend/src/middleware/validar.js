import { ValidationError } from '../domain/errors.js';

const FUENTES = ["params", "query", "body"];

function validar(schemas) {
  return (req, _res, next) => {
    const errores = [];
    const validado = {};

    for (const fuente of FUENTES) {
      const schema = schemas[fuente];
      if (!schema) continue;

      const resultado = schema.safeParse(req[fuente]);
      if (resultado.success) {
        validado[fuente] = resultado.data;
      } else {
        for (const issue of resultado.error.issues) {
          const campo = issue.path.join(".") || fuente;
          errores.push(`${campo}: ${campoMensaje(issue)}`);
        }
      }
    }

    if (errores.length > 0) {
      return next(new ValidationError(errores.join("; ")));
    }

    req.validado = validado;
    next();
  };
}

function campoMensaje(issue) {
  switch (issue.code) {
    case 'invalid_type':
      return `se esperaba ${issue.expected} pero se recibió ${issue.received}`;
    case 'too_small':
      if (issue.type === 'string') return 'es obligatorio';
      return `el valor mínimo es ${issue.minimum}`;
    case 'invalid_string':
      return 'formato inválido';
    case 'unrecognized_keys':
      return `clave(s) no permitida(s): ${issue.keys.join(', ')}`;
    case 'invalid_enum_value':
      return `valor no válido`;
    default:
      return 'inválido';
  }
}

export { validar };
