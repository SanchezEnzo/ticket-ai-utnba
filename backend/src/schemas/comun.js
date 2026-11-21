import { z } from 'zod';

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export { idSchema };
