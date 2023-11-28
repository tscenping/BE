import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('Users e2e', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('GET /me', () => {
		return request(app.getHttpServer()).get('/me').expect(200).expect({});
	});

	it('GET /hello', async () => {
		return request(app.getHttpServer())
			.get('/hello')
			.expect(200)
			.query({ name: 'Dale' })
			.expect({
				message: 'Hello, Dale!',
			});
	});
});
