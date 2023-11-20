import { IsUUID } from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Friend extends BaseEntity {
	@Column()
	fromUserId: number;

	@Column()
	toUserId: number;
}
