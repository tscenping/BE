import { IsUUID } from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Friend extends BaseEntity {
	@Column()
	@IsUUID()
	fromUserId: string;

	@Column()
	@IsUUID()
	toUserId: string;
}
