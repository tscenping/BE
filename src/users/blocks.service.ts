import { BadRequestException, Injectable } from '@nestjs/common';
import { BlocksRepository } from './blocks.repository';
import { UserRepository } from './users.repository';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { BlockUserResponseDto } from './dto/block-user-response.dto';
import { BlockUserReturnDto } from './dto/block-user-return.dto';
import { UUID } from 'crypto';

class BlockDto {
	id: number;
	fromUserId: number;
	toUserId: number;
}

@Injectable()
export class BlocksService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly blockRepository: BlocksRepository,
	) {}

	async applyBlock(fromUserId: number, toUserId: number) {
		if (fromUserId === toUserId) {
			throw new BadRequestException(`Could not blocking yourself`);
		}
		// toUser이 가입한 유저인지
		await this.validateUserExists(toUserId);

		// 이미 차단했는지 확인하기: fromuser 기준에 해당하는 touser를 찾는다.
		const block = await this.blockRepository.findOne({
			where: {
				fromUserId,
				toUserId,
			},
		});
		if (block)
			throw new BadRequestException(`${toUserId}} is already blocked`);

		//block 하기
		const newBlock = this.blockRepository.create({
			fromUserId,
			toUserId,
		});
		const result = await this.blockRepository.save(newBlock);
		if (!result) throw DBUpdateFailureException('Apply block failed');
	}

	async cancelBlock(fromUserId: number, toUserId: number) {
		if (fromUserId === toUserId) {
			throw new BadRequestException(`Could not non-blocking yourself`);
		}
		// toUser이 가입한 유저인지
		await this.validateUserExists(toUserId);

		// 이미 차단 취소했는지 확인하기: fromuser 기준에 해당하는 touser를 찾기
		const block: BlockDto | null = await this.blockRepository.findOne({
			where: {
				fromUserId,
				toUserId,
			},
		});
		if (!block)
			throw new BadRequestException(`${toUserId}} is now non-blocked`);
		// block 취소하기
		const result = await this.blockRepository.softDelete(block.id);
		if (result.affected !== 1) {
			throw DBUpdateFailureException('Cancel block failed');
		}
	}

	async findBlockUserListWithPage(
		userId: number,
		page: number,
	): Promise<BlockUserResponseDto> {
		const blockUsers: BlockUserReturnDto[] =
			await this.blockRepository.findBlockUsers(userId, page);

		const totalItemCount = await this.blockRepository.count({
			where: {
				fromUserId: userId,
			},
		});

		return { friends: blockUsers, totalItemCount };
	}

	async validateUserExists(userId: number) {
		const user = await this.userRepository.findOne({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new BadRequestException(
				`User with id ${userId} doesn't exist`,
			);
		}
	}
}
