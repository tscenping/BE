import { User } from '../../user-repository/entities/user.entity';

export class acceptGameParamDto {
	invitationId: number;
	invitedUser: User;
}
