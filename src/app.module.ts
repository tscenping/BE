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
import typeOrmConfig from './config/typeorm.config';
import userConfig from './config/user.config';
import { GameModule } from './game/game.module';
import { UsersModule } from './users/users.module';
import redisConfig from './config/redis.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: './BE-config/.env',
			load: [
				ftConfig,
				userConfig,
				pgadminConfig,
				jwtConfig,
				typeOrmConfig,
				redisConfig
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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
