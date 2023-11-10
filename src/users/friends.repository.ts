import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { Repository, DataSource } from 'typeorm';

export class FriendRepository extends Repository<Friend> {
  constructor(@InjectRepository(Friend) private dataSource: DataSource) {
    super(Friend, dataSource.manager);
  }
}
