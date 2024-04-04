import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import * as process from 'process';

export default registerAs('google', () => {
	const GOOGLE_CLIENT_ID = z.string().parse(process.env.GOOGLE_CLIENT_ID);
	const GOOGLE_CLIENT_SECRET = z
		.string()
		.parse(process.env.GOOGLE_CLIENT_SECRET);
	const GOOGLE_REDIRECT_URI = z
		.string()
		.parse(process.env.GOOGLE_REDIRECT_URI);

	return {
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URI,
	};
});
