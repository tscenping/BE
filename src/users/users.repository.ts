import { User } from './entities/user.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

export class UserRepository extends Repository<User> {
  constructor(@InjectRepository(User) private dataSource: DataSource) {
    super(User, dataSource.manager);
  }

  async findOneByNickname(nickname: string) {
    return await this.findOne({ where: { nickname } });
  }
}
