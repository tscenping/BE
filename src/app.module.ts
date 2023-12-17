import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import ftConfig from './config/ft.config';
import jwtConfig from './config/jwt.config';
import pgadminConfig from './config/pgadmin.config';
import redisConfig from './config/redis.config';
import typeOrmConfig from './config/typeorm.config';
import { GameModule } from './game/game.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import userConfig from './config/user.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath:
				process.env.NODE_ENV === 'test'
					? './BE-config/.env.test'
					: './BE-config/.env',
			load: [
				redisConfig,
				ftConfig,
				pgadminConfig,
				jwtConfig,
				typeOrmConfig,
				redisConfig,
				userConfig,
			],
		}),
		TypeOrmModule.forRootAsync({
			inject: [typeOrmConfig.KEY],
			useFactory: (typeOrmConfigure: ConfigType<typeof typeOrmConfig>) =>
				typeOrmConfigure,
		}),
		RedisModule.forRootAsync({
			inject: [redisConfig.KEY],
			imports: [ConfigModule.forFeature(redisConfig)],
			useFactory: (redisConfigure: ConfigType<typeof redisConfig>) =>
				redisConfigure,
		}),
		ScheduleModule.forRoot(),
		AuthModule,
		UsersModule,
		GameModule,
		ChannelsModule,
		RedisModule,
		SwaggerModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
