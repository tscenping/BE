import { User } from 'src/user-repository/entities/user.entity';

export type UserFindReturnDto = {
	user: User;
	mfaUrl?: string;
};
