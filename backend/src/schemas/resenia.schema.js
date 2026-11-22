import { z } from 'zod';
import { idSchema } from './comun.js';

const eventoIdParamsSchema = z.strictObject({
  id: idSchema,
});

const crearReseniaBodySchema = z.strictObject({
  puntaje: z.number({ coerce: false }).min(1).max(5).refine(
    (v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9,
    { message: 'El puntaje debe ser múltiplo de 0.5.' }
  ),
  comentario: z.string().trim().min(1).max(1000),
});

const sinQuerySchema = z.strictObject({});

export { eventoIdParamsSchema, crearReseniaBodySchema, sinQuerySchema };
