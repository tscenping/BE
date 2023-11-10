import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FriendRepository } from './friends.repository';
import { UserRepository } from './users.repository';

@Injectable()
export class FriendsService {
  constructor(
    private readonly friendRepository: FriendRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private readonly logger = new Logger(FriendsService.name);

  /**
   * 친구 추가
   * @param fromUserId 친구요청을 보낸 유저의 id
   * @param toUserId 친구요청을 받은 유저의 id
   * @returns
   */
  async createFriend(fromUserId: number, toUserId: number) {
    // 본인->본인 친구요청
    if (fromUserId === toUserId) {
      throw new BadRequestException(`Can't be friend with yourself`);
    }

    // 이미 친구인지 검사
    const isExistFriend = await this.isExistFriend(fromUserId, toUserId);
    if (isExistFriend) {
      throw new BadRequestException(`Already friend`);
    }

    // 존재하는 유저인지 검사
    const isExistUser = await this.isExistUser(toUserId);
    if (!isExistUser) {
      throw new BadRequestException(`User with id ${toUserId} doesn't exist`);
    }

    // 친구 추가
    const friend = this.friendRepository.create({
      fromUserId,
      toUserId,
    });
    this.logger.log('friend: ', friend);
    await this.friendRepository.save(friend);
  }

  async isExistFriend(fromUserId: number, toUserId: number) {
    const friend = await this.friendRepository.findOne({
      where: {
        fromUserId,
        toUserId,
      },
    });

    return friend !== null;
  }

  async isExistUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    return user !== null;
  }
}
