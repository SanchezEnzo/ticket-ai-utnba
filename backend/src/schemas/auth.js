import { z } from 'zod';

const loginBodySchema = z.strictObject({
  email: z.string().min(1),
  password: z.string().min(1),
});

export { loginBodySchema };
