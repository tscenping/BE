import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const USER_CONFIG = 'user';

export default registerAs(USER_CONFIG, () => {
	const FIRST_NICKNAME_PREFIX = z
		.string()
		.parse(process.env.FIRST_NICKNAME_PREFIX);

	return {
		FIRST_NICKNAME_PREFIX,
	};
});
