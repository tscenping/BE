import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/base-entity';
@Entity()
export class Block extends BaseEntity {
	@Column()
	fromUserId: number;

	@Column()
	toUserId: number;
}
