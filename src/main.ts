import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpFilter } from './common/exception/custom-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { SocketIoAdapter } from './common/adapter/socket-io.adapter';
import { WsFilter } from './common/exception/custom-ws-exception.filter';

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
	app.useGlobalFilters(new HttpFilter(), new WsFilter());
	app.useGlobalPipes(new ValidationPipe());

	app.useWebSocketAdapter(new SocketIoAdapter(app));

	setupSwagger(app);
	await app.listen(3000);
}

bootstrap();
