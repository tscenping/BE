import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

export class UserRepository extends Repository<User> {
	constructor(@InjectRepository(User) private dataSource: DataSource) {
		super(User, dataSource.manager);
	}

	async findOneByNickname(nickname: string) {
		return await this.findOne({ where: { nickname } });
	}

	async findMyProfile(userId: number) {
		const myProfile = this.dataSource.query(
			`
			SELECT nickname,
			avatar,
			"statusMessage",
			"loseCount",
			"winCount",
			"loseCount" + "winCount" AS totalCount,
			"ladderScore",
			"ladderMaxScore"
			FROM "user" u
			WHERE u.id = $1 AND u."deletedAt" IS NULL
			`,
			[userId],
		);

		// TODO: ladderRank cache에서 조회하기
		return myProfile;
	}
}
