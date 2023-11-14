import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import {
  TypeOrmModule,
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import ftConfig from './config/ft.config';
import jwtConfig from './config/jwt.config';
import pgadminConfig from './config/pgadmin.config';
import typeOrmConfig from './config/typeorm.config';
import userConfig from './config/user.config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './BE-config/.env',
      load: [ftConfig, userConfig, pgadminConfig, jwtConfig, typeOrmConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [typeOrmConfig.KEY],
      useFactory: (typeOrmConfigure: ConfigType<typeof typeOrmConfig>) =>
        typeOrmConfigure,
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
