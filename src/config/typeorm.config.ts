import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as process from 'process';
import { z } from 'zod';

export default registerAs('typeorm', () => {
	const TYPE = 'postgres';
	const POSTGRES_HOST = z.string().parse(process.env.POSTGRES_HOSTNAME);
	const POSTGRES_PORT = parseInt(
		z.string().parse(process.env.POSTGRES_PORT),
		10,
	);
	const POSTGRES_USER = z.string().parse(process.env.POSTGRES_USER);
	const POSTGRES_PASSWORD = z.string().parse(process.env.POSTGRES_PASSWORD);
	const POSTGRES_DB = z
		.string()
		.parse(
			process.env.NODE_ENV === 'test'
				? process.env.POSTGRES_TEST_DB
				: process.env.POSTGRES_DB,
		);
	const ENTITIES = [__dirname + '/../**/entities/*.entity.{js,ts}'];
	const SYNCHRONIZE = true;

	return {
		type: TYPE,
		host: POSTGRES_HOST,
		port: POSTGRES_PORT,
		username: POSTGRES_USER,
		password: POSTGRES_PASSWORD,
		database: POSTGRES_DB,
		entities: ENTITIES,
		synchronize: SYNCHRONIZE,
	} satisfies TypeOrmModuleOptions;
});
