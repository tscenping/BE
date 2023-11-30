import { SwaggerModule } from '@nestjs/swagger';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
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
				// userConfig,
				pgadminConfig,
				jwtConfig,
				typeOrmConfig,
				redisConfig,
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
