import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const PGADMIN_CONFIG = 'pgadmin';

export default registerAs(PGADMIN_CONFIG, () => {
  const PGADMIN_DEFAULT_EMAIL = z
    .string()
    .parse(process.env.PGADMIN_DEFAULT_EMAIL);

  const PGADMIN_DEFAULT_PASSWORD = z
    .string()
    .parse(process.env.PGADMIN_DEFAULT_PASSWORD);

  return {
    PGADMIN_DEFAULT_EMAIL,
    PGADMIN_DEFAULT_PASSWORD,
  };
});
