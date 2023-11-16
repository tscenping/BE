import { IsUUID } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { numberIdBaseEntity } from '../../common/number-id-base-entity';
@Entity()
export class Block extends numberIdBaseEntity {
	@Column()
	@IsUUID()
	fromUserId: string;

	@Column()
	@IsUUID()
	toUserId: string;
}
