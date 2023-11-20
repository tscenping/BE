import { DataSource, Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_PAGE_SIZE } from '../common/constants';
import { BlockUserInfoDto } from './dto/block-user-info.dto';
import { DBQueryErrorException } from '../common/exception/custom-exception';

export class BlocksRepository extends Repository<Block> {
	constructor(@InjectRepository(Block) private dataSource: DataSource) {
		super(Block, dataSource.manager);
	}

	async findBlockUsers(
		userId: string,
		page: number,
	): Promise<BlockUserInfoDto[]> {
		const users = this.dataSource
			.query(
				`
			SELECT u.id, u.nickname, u.avatar, u.status
			FROM Block b
			JOIN "user" u
			ON (u.id)::uuid = (b."toUserId")::uuid 
			WHERE (b."fromUserId")::uuid = ($1)::uuid AND b."deletedAt" IS NULL
			LIMIT $2 OFFSET $3;
			`,
				[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
			)
			.catch((reason) => {
				throw DBQueryErrorException(reason);
			});
		return users;
	}
}
