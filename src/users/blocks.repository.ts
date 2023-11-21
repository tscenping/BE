import { DataSource, Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_PAGE_SIZE } from '../common/constants';
import { BlockUserReturnDto } from './dto/block-user-return.dto';
import { DBQueryErrorException } from '../common/exception/custom-exception';

export class BlocksRepository extends Repository<Block> {
	constructor(@InjectRepository(Block) private dataSource: DataSource) {
		super(Block, dataSource.manager);
	}

	async findBlockUsers(
		userId: number,
		page: number,
	): Promise<BlockUserReturnDto[]> {
		const users = this.dataSource
			.query(
				`
			SELECT u.id, u.nickname, u.avatar, u.status
			FROM Block b
			JOIN "user" u
			ON u.id = b."toUserId"
			WHERE b."fromUserId" = $1 AND b."deletedAt" IS NULL
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
