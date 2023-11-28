import { ConfigService } from '@nestjs/config';
import typeormConfig from '../src/config/typeorm.config';
import { DataSource } from 'typeorm';
import { createDatabase, dropDatabase } from 'typeorm-extension';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { z } from 'zod';

export class TestDBInitiator {
	private readonly initialDatabase: string;
	private readonly testDatabase: string;
	readonly dbOptions: PostgresConnectionOptions;
	readonly configService: ConfigService;

	constructor() {
		this.initialDatabase = z.string().parse(process.env.POSTGRES_DB);
		this.testDatabase = z.string().parse(process.env.POSTGRES_TEST_DB);
		this.configService = new ConfigService();
		const config = this.configService.get(typeormConfig.KEY);

		this.dbOptions = {
			...config,
			database:
				process.env.NODE_ENV === 'test'
					? this.testDatabase
					: this.initialDatabase,
		};
	}

	async createDatabase() {
		await this.dropDatabase();
		console.log(`Creating test database '${this.dbOptions.database}'`);
		await createDatabase({
			options: this.dbOptions,
			initialDatabase: this.initialDatabase,
			ifNotExist: false,
		});
		const dataSource = await this.createTestDataSource(this.dbOptions);

		console.log('Running migrations');
		dataSource.runMigrations({ transaction: 'all' });
		await dataSource.destroy();

		console.log('✓ Done. Test database is ready to accept connections ✓\n');
	}

	async dropDatabase(dropAll = false) {
		console.log(`Dropping test database '${this.testDatabase}'`);
		if (dropAll) {
			const ds = await this.createTestDataSource({
				...this.dbOptions,
				database: this.initialDatabase,
			});
			await ds.query(
				`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.testDatabase}';`,
			);
		}
		await dropDatabase({
			options: this.dbOptions,
			initialDatabase: this.initialDatabase,
		});
	}

	async createTestDataSource(dbOptions: PostgresConnectionOptions) {
		const dataSource = new DataSource(dbOptions);
		await dataSource.initialize();
		return dataSource;
	}
}
