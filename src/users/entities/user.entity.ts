import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { NICKNAME_REGEXP, STATUS_MESSAGE_REGEXP } from 'src/common/constants';
import { UserStatus } from 'src/common/enum';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['nickname'])
export class User extends BaseEntity {
	@Column({ unique: true, default: null })
	@IsString()
	@Length(1, 10)
	@IsNotEmpty()
	@Matches(NICKNAME_REGEXP)
	nickname: string;

	@Column({ default: null })
	@IsString()
	avatar: string;

	@Column()
	@IsNotEmpty()
	@IsString()
	email: string;

	@Column({ default: false })
	@IsNotEmpty()
	@IsBoolean()
	isMfaEnabled: boolean;

	@Column({ default: 1200 })
	@IsNotEmpty()
	@IsNumber()
	ladderScore: number;

	@Column({ default: 1200 })
	@IsNotEmpty()
	@IsNumber()
	ladderMaxScore: number;

	@Column({ default: 0 })
	@IsNotEmpty()
	@IsNumber()
	winCount: number;

	@Column({ default: 0 })
	@IsNotEmpty()
	@IsNumber()
	loseCount: number;

	//   @Column({ nullable: true })
	//   @IsString()
	//   accessToken!: string | null;

	@Column({ default: null })
	@IsString()
	refreshToken: string;

	@Column({ default: null })
	@IsString()
	gameSocketId: string;

	@Column({ default: null })
	@IsString()
	chatSocketId: string;

	@Column({ default: null })
	@Length(1, 20)
	@IsString()
	@IsOptional()
	@Matches(STATUS_MESSAGE_REGEXP)
	statusMessage: string;

	@Column({ default: UserStatus.OFFLINE })
	@IsNotEmpty()
	@IsString()
	status: UserStatus;
}
