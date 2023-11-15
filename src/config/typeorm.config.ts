import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import * as process from 'process';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('typeorm', () => {
    const TYPE = 'postgres' as 'postgres';
    const POSTGRES_HOST = z.string().parse(process.env.POSTGRES_HOST);
    const POSTGRES_PORT = parseInt(
        z.string().parse(process.env.POSTGRES_PORT),
        10,
    );
    const POSTGRES_USER = z.string().parse(process.env.POSTGRES_USER);
    const POSTGRES_PASSWORD = z.string().parse(process.env.POSTGRES_PASSWORD);
    const POSTGRES_DB = z.string().parse(process.env.POSTGRES_DB);
    const ENTITIES = [__dirname + '/../**/entities/*.entity.{js,ts}'];
    const SYNCHRONIZE: boolean = true;

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