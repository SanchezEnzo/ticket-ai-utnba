import { z } from 'zod';
import { compraIdParamsSchema } from './compras.js';

const listarMensajesQuerySchema = z.strictObject({
  desde: z
    .string()
    .datetime({ timezone: 'all' })
    .transform((val) => new Date(val))
    .optional(),
});

const enviarMensajeBodySchema = z.strictObject({
  texto: z.string().trim().min(1).max(1000),
});

const sinQuerySchema = z.strictObject({});

export { compraIdParamsSchema, listarMensajesQuerySchema, enviarMensajeBodySchema, sinQuerySchema };
