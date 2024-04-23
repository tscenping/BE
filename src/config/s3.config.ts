import { z } from 'zod';
import { registerAs } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export default registerAs('s3', () => {
	const S3_BUCKET_NAME = z.string().parse(process.env.S3_BUCKET_NAME);
	const S3Object = new S3Client({
		region: z.string().parse(process.env.S3_REGION),
		credentials: {
			accessKeyId: z.string().parse(process.env.S3_ACCESS_KEY_ID),
			secretAccessKey: z.string().parse(process.env.S3_SECRET_ACCESS_KEY),
		},
	});

	return {
		S3_BUCKET_NAME,
		S3Object,
	};
});
