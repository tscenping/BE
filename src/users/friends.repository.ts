import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { Repository, DataSource } from 'typeorm';
import { FriendInfoDto } from './dto/friend-info.dto';
import { DATA_PER_PAGE } from 'src/common/constants';

export class FriendRepository extends Repository<Friend> {
  constructor(@InjectRepository(Friend) private dataSource: DataSource) {
    super(Friend, dataSource.manager);
  }

  async findFriend(fromUserId: number, toUserId: number) {
    return await this.findOne({
      where: {
        fromUserId,
        toUserId,
      },
    });
  }

  async findFriendInfos(
    userId: number,
    page: number,
  ): Promise<FriendInfoDto[]> {
    // raw query
    const friends = await this.dataSource.query(
      `
      SELECT u.id, u.nickname, u.avatar, u.status
      FROM friend f
      JOIN "user" u
      ON u.id = f."toUserId"
      WHERE f."fromUserId" = $1
      LIMIT $2 OFFSET $3
      `,
      [userId, DATA_PER_PAGE, (page - 1) * DATA_PER_PAGE],
    );
    return friends;
  }
}
