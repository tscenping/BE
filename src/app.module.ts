import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import ftConfig from './config/ft.config';
import { typeOrmConfig } from './config/typeorm.config';
import { UsersModule } from './users/users.module';
import userConfig from './config/user.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './BE-config/.env',
      load: [ftConfig, userConfig],
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
