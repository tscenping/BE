import { IsUUID } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/base-entity';
@Entity()
export class Block extends BaseEntity {
	@Column()
	@IsUUID()
	fromUserId: string;

	@Column()
	@IsUUID()
	toUserId: string;
}
