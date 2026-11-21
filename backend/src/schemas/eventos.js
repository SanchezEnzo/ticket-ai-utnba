import { z } from 'zod';
import { idSchema } from './comun.js';

const eventoIdParamsSchema = z.strictObject({
  id: idSchema,
});

const listarEventosQuerySchema = z.strictObject({
  q: z.string().optional(),
  categoria: z.string().optional(),
  orden: z.enum(['precio', 'fecha', 'puntaje']).optional(),
});

const tipoEntradaBodySchema = z.strictObject({
  nombre: z.string(),
  descripcion: z.string(),
  precio: z.number(),
  cupo: z.number(),
});

const crearEventoBodySchema = z.strictObject({
  nombre: z.string(),
  descripcion: z.string(),
  categoriaId: z.string(),
  fecha: z.string(),
  multimedia: z.array(z.string()).optional(),
  tiposEntrada: z.array(tipoEntradaBodySchema),
});

export { eventoIdParamsSchema, listarEventosQuerySchema, crearEventoBodySchema };
