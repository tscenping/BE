import { BadRequestException } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import {
	CHANNEL_NAME_REGEXP,
	CHANNEL_PASSWORD_REGEXP,
} from 'src/common/constants';
import { ChannelType } from 'src/common/enum';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

@Entity()
export class Channel extends BaseEntity {
	@Column({ default: null, type: 'varchar' })
	@IsString()
	@Length(1, 10)
	@Matches(CHANNEL_NAME_REGEXP)
	@IsOptional()
	name?: string | null;

	@Column()
	@IsString()
	@IsEnum(ChannelType)
	channelType: ChannelType;

	@Column({ default: null, type: 'varchar' })
	@IsString()
	@Length(8, 16)
	@Matches(CHANNEL_PASSWORD_REGEXP)
	@IsOptional()
	password: string | null;

	@Column({ default: null, type: 'integer' })
	@IsOptional()
	@IsNumber()
	@IsPositive()
	ownerId?: number | null;

	@BeforeInsert()
	@BeforeUpdate()
	async hashPassword() {
		if (this.password) {
			try {
				this.password = await bycrypt.hash(this.password, 10);
			} catch (e) {
				console.error(e);
				throw new BadRequestException(
					`비밀번호 암호화에 실패했습니다.`,
				);
			}
		}
	}
}
