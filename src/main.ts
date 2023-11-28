import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ToHttpFilter } from './common/exception/custom-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const httpsOptions = {
		key: fs.readFileSync('./BE-config/localhost-key.pem'),
		cert: fs.readFileSync('./BE-config/localhost.pem'),
	};

	const app = await NestFactory.create(AppModule, {
		httpsOptions,
	});

	app.enableCors({
		credentials: true,
		origin: 'https://localhost:8001',
	});
	app.use(cookieParser());
	// app.useGlobalInterceptors(new LoggingInterceptor());
	app.useGlobalFilters(new ToHttpFilter());
	app.useGlobalPipes(new ValidationPipe());

	await app.listen(3000);
	console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
