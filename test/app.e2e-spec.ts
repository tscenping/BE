import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestDBInitiator } from './config.e2e';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';

describe('HelloController (e2e)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let databaseConfig: TestDBInitiator;

	beforeAll(async () => {
		databaseConfig = new TestDBInitiator();
		dataSource = await databaseConfig.createTestDataSource(
			databaseConfig.dbOptions,
		);

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot({
					...databaseConfig.dbOptions,
					autoLoadEntities: true,
				}),
				AppModule,
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await dataSource.destroy();
		await app.close();
	});
});
