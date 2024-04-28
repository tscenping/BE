import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DEFAULT_PAGE_SIZE } from '../common/constants';
import { DBQueryErrorException } from '../common/exception/custom-exception';
import { BlockUserReturnDto } from './dto/block-user-return.dto';
import { Block } from './entities/block.entity';

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

	async findAllBlockUsers(userId: number): Promise<BlockUserReturnDto[]> {
		const users = this.dataSource
			.query(
				`
			SELECT u.id, u.nickname, u.avatar, u.status
			FROM Block b
			JOIN "user" u
			ON u.id = b."toUserId"
			WHERE b."fromUserId" = $1 AND b."deletedAt" IS NULL
			`,
				[userId],
			)
			.catch((reason) => {
				throw DBQueryErrorException(reason);
			});
		return users;
	}

	async findBlock(
		fromUserId: number,
		toUserId: number,
	): Promise<Block | null> {
		return await this.findOne({
			where: {
				fromUserId,
				toUserId,
			},
		});
	}
}
