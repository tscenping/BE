import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Game])],
	controllers: [GameController],
})
export class GameModule {}
