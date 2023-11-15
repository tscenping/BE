import { registerAs } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { z } from 'zod';

export default registerAs('jwt', () => {
	const secret = z.string().parse(process.env.JWT_SECRET);
	const expiresIn = z.string().parse(process.env.JWT_EXPIRATION_TIME);

	return {
		secret,
		signOptions: {
			expiresIn,
		},
	} satisfies JwtModuleOptions;
});
