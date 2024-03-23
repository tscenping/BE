import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/base-entity';
import { IsNumber, IsPositive } from 'class-validator';
@Entity()
export class Block extends BaseEntity {
	@Column()
	@IsNumber()
	@IsPositive()
	fromUserId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	toUserId: number;
}
