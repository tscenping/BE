import { IsNumber, IsPositive } from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Friend extends BaseEntity {
	@Column()
	@IsNumber()
	@IsPositive()
	fromUserId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	toUserId: number;
}
