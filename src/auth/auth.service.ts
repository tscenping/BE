import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from './../users/users.repository';
import { User42Dto } from './dto/user-42.dto';

type UserFindreturn = {
  user: User;
  mfaCode?: string;
};

@Injectable()
export class AuthService {
  private readonly nicknamePrefix: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.nicknamePrefix = this.configService.getOrThrow<string>(
      'FIRST_NICKNAME_PREFIX',
    );
  }

  private async createMfaCode(): Promise<string> {
    return Promise.resolve('mfaCode'); // TODO: 2FA 코드 생성
  }

  async findOrCreateUser(userData: User42Dto): Promise<UserFindreturn> {
    const user = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (!user) {
      const user = this.userRepository.create(userData);
      user.nickname = this.nicknamePrefix + userData.nickname;
      await this.userRepository.save(user);

      return { user };
    }

    if (!user.isMfaEnabled) {
      return { user };
    }

    const mfaCode = await this.createMfaCode();
    return { user, mfaCode };
  }

  async generateJwtToken(user: User) {
    const payload = { id: user.id, email: user.email };
    // accessToken 생성
    const accessToken = await this.jwtService.signAsync(payload);
    // refreshToken 생성
    const refreshToken = await this.jwtService.signAsync({ id: payload.id });
    // refreshToken을 DB에 저장한다.
    await this.userRepository.update(user.id, { refreshToken });
    return { jwtAccessToken: accessToken, jwtRefreshToken: refreshToken };
  }

  async validateNickname(nickname: string) {
    const user = await this.userRepository.findOneByNickname(nickname);
    if (user) {
      throw new HttpException(
        '이미 존재하는 닉네임입니다.',
        HttpStatus.CONFLICT,
      );
    }
  }
}
