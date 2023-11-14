import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const FT_CONFIG = 'ft';

export default registerAs(FT_CONFIG, () => {
  const FT_CLIENT_ID = z.string().parse(process.env.FORTYTWO_CLIENT_ID);
  const FT_CLIENT_SECRET = z.string().parse(process.env.FORTYTWO_CLIENT_SECRET);
  const FT_REDIRECT_URI = z.string().parse(process.env.FORTYTWO_REDIRECT_URI);

  return {
    FT_CLIENT_ID,
    FT_CLIENT_SECRET,
    FT_REDIRECT_URI,
  };
});
