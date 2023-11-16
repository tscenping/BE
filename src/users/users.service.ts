import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { UserRepository } from './users.repository';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

@Injectable()
export class UsersService {
	constructor(private readonly userRepository: UserRepository) {}

	private readonly logger = new Logger(UsersService.name);

	// TODO: test용 메서드. 추후 삭제
	async isNicknameExists(nickname: string) {
		const user = await this.userRepository.findOne({
			where: { nickname },
		});

		return !!user;
	}

	// TODO: test용 메서드. 추후 삭제
	async createUser(nickname: string, email: string) {
		const user = this.userRepository.create({
			nickname,
			email,
		});

		await this.userRepository.save(user);

		return user;
	}

	async findMyProfile(userId: string) {
		const myProfile = await this.userRepository.findMyProfile(userId);

		return myProfile;
	}

	async login(userId: string, loginRequestDto: LoginRequestDto) {
		const avatar = loginRequestDto.avatar;
		const nickname = loginRequestDto.nickname;

		const user = await this.userRepository.findOne({
			where: { id: userId },
		});
		if (!user)
			throw new HttpException(`there is no user`, HttpStatus.BAD_REQUEST);

		const resault = await this.userRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
		});

		if (resault.affected !== 1) {
			throw DBUpdateFailureException(UsersService.name);
		}
	}
}
