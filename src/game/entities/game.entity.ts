import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsPositive,
	IsString,
} from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { GameStatus, GameType } from 'src/common/enum';
import { Column, Entity } from 'typeorm';

@Entity()
export class Game extends BaseEntity {
	@Column()
	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	winnerId: number;

	@Column()
	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	loserId: number;

	@Column()
	@IsNotEmpty()
	@IsString()
	gameType: GameType;

	@Column()
	@IsNotEmpty()
	@IsNumber()
	winnerScore: number;

	@Column()
	@IsNotEmpty()
	@IsNumber()
	loserScore: number;

	@Column()
	@IsNotEmpty()
	@IsString()
	gameStatue: GameStatus;

	@Column()
	@IsNotEmpty()
	@IsNumber()
	@IsIn([1, 2, 3])
	ballSpeed: number;

	@Column()
	@IsNotEmpty()
	@IsNumber()
	@IsIn([1, 2, 3])
	racketSize: number;
}
