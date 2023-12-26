import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const USER_CONFIG = 'user';

export default registerAs(USER_CONFIG, () => {
	const MFA_SECRET = z.string().parse(process.env.MFA_SECRET);
	const CRYPTO_KEY = z.string().parse(process.env.CRYPTO_KEY);
	const CRYPTO_SECRET_IV = z.string().parse(process.env.CRYPTO_SECRET_IV);

	return {
		MFA_SECRET,
		CRYPTO_KEY,
		CRYPTO_SECRET_IV,
	};
});
