import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const USER_CONFIG = 'user';

export default registerAs(USER_CONFIG, () => {
	const MFA_SECRET = z.string().parse(process.env.MFA_SECRET);

	return {
		mfaSecret: MFA_SECRET,
	};
});
