import { z } from 'zod';
import { idSchema } from './comun.js';

const crearCompraBodySchema = z.strictObject({
  eventoId: idSchema,
  tipoEntradaId: idSchema,
  cantidad: z.number(),
});

const compraIdParamsSchema = z.strictObject({
  id: idSchema,
});

const emptyQuerySchema = z.strictObject({});

export { crearCompraBodySchema, compraIdParamsSchema, emptyQuerySchema };
