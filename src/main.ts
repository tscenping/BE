import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

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

  await app.listen(3000);
}
bootstrap();
