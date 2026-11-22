import { z } from 'zod';
import { idSchema } from './comun.js';

const favoritoParamsSchema = z.strictObject({
  eventoId: idSchema,
});

const sinQuerySchema = z.strictObject({});

export { favoritoParamsSchema, sinQuerySchema };
