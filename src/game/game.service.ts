import {
	BadRequestException,
	ImATeapotException,
	Injectable,
} from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { GameGateway } from './game.gateway';
import { GameParamDto } from './dto/game-param.dto';
import { GameInvitationRepository } from './game-invitation.repository';
import { DeleteGameInvitationParamDto } from './dto/delete-invitation-param.dto';
import { DeleteGameInvitationsParamDto } from './dto/delete-invitations-param.dto';
import { UserStatus } from '../common/enum';
import { CreateGameParamDto } from './dto/create-game-param.dto';
import { GatewaySendInvitationReplyDto } from './dto/gateway-send-invitation-reaponse.dto';
import { User } from '../users/entities/user.entity';
import * as moment from 'moment';

@Injectable()
export class GameService {
	constructor(
		private readonly gameRepository: GameRepository,
		private readonly gameInvitationRepository: GameInvitationRepository,
		private readonly gameGateway: GameGateway,
		private readonly usersRepository: UsersRepository,
	) {}

	async createInvitation(invitationParamDto: CreateGameInvitationParamDto) {
		const invitingUser = invitationParamDto.invitingUser;
		const invitedUserId = invitationParamDto.invitedUserId;
		const gameType = invitationParamDto.gameType;

		// 본인 스스로인지
		if (invitingUser.id === invitedUserId)
			throw new BadRequestException('자기 자신을 초대할 수 없습니다');

		// 상대가 존재하는 유저인지
		const invitedUser = await this.checkUserExist(invitedUserId);

		// 상대가 ONLINE 인지 => 접속 중인 유저가 아니라면 없던 일이 됨
		if (
			invitedUser.status === UserStatus.OFFLINE ||
			!invitedUser.channelSocketId
		)
			throw new ImATeapotException(
				`초대된 유저 ${invitedUserId} 는 OFFLINE 상태입니다`,
			);

		// game invitation DB 저장
		const gameInvitation =
			await this.gameInvitationRepository.createGameInvitation(
				invitationParamDto,
			);

		// TODO: 알림 보내기
		const gatewayInvitationParamDto: GatewayCreateGameInvitationParamDto = {
			invitationId: gameInvitation.id,
			invitingUserNickname: invitingUser.nickname,
			invitedUserChannelSocketId: invitedUser.channelSocketId,
			gameType: gameType,
		};
		await this.gameGateway.inviteGame(gatewayInvitationParamDto);
	}

	async createGame(createGameParamDto: CreateGameParamDto) {
		const invitationId = createGameParamDto.gameInvitationId;
		const invitedUserId = createGameParamDto.invitedUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUserId,
			},
			order: { createdAt: 'DESC' },
		});
		if (!invitation)
			throw new ImATeapotException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);

		// 10초 지나면 유효하지 않은 초대
		const currentTime = moment();
		const diff = currentTime.diff(invitation.createdAt, 'seconds');

		if (diff >= 10) {
			throw new ImATeapotException(
				`해당하는 invitation id ${invitationId} 는 시간초과로 유효하지 않습니다`,
			);
		}

		// 두 유저 모두 ONLINE 인지 확인
		const invitingUser = await this.checkUserExist(
			invitation.invitingUserId,
		);
		if (
			invitingUser.status === UserStatus.OFFLINE ||
			!invitingUser.channelSocketId
		)
			throw new ImATeapotException(
				`초대한 유저 ${invitingUser.id} 는 OFFLINE 상태입니다`,
			);

		const invitedUser = await this.checkUserExist(invitedUserId);

		if (
			invitedUser.status === UserStatus.OFFLINE ||
			!invitedUser.channelSocketId
		)
			throw new ImATeapotException(
				`초대된 유저 ${invitedUser.id} 는 OFFLINE 상태입니다`,
			);

		/* TODO: DB에 쌓인 유효하지 않은 초대장들은 어떻게 지우지 ?
		 *	1. cache-manager ttl을 쓴다
		 *	2. cron을 쓴다
		 * 	3. 그냥 놔둔다
		 * 	4. 트리거가 되는 요청 때 기회는 이때다! 지워버린다
		 *	일단 4가 채택됨 -> 취소 및 거절시 해당하는 invitation이 있을 때 */

		/* TODO: Game 세팅
		 *	1. game DB 만들기 ✅
		 *
		 * 	2. game room join하기
		 * 	3. game start event emit */

		const plyer1Id = invitingUser.id;
		const plyer2Id = invitedUser.id;
		const gameType = invitation.gameType;

		const gameParamDto = new GameParamDto(plyer1Id, plyer2Id, gameType);
		const game = await this.gameRepository.createGame(gameParamDto);

		// 성사됐으니까 game invitation 지워주기
		await this.gameInvitationRepository.softDelete({
			id: invitationId,
		});

		// 두 유저에게 game id emit
		const invitationReplyToInvitingUserDto: GatewaySendInvitationReplyDto =
			{
				targetUserChannelSocketId: invitingUser.channelSocketId,
				isAccepted: true,
				gameId: game.id,
			};
		const invitationReplyToInvitedUserDto: GatewaySendInvitationReplyDto = {
			targetUserChannelSocketId: invitedUser.channelSocketId,
			isAccepted: true,
			gameId: game.id,
		};

		await this.gameGateway.sendInvitationReply(
			invitationReplyToInvitingUserDto,
		);
		await this.gameGateway.sendInvitationReply(
			invitationReplyToInvitedUserDto,
		);
	}

	async deleteInvitationByInvitingUserId(
		deleteInvitationParamDto: DeleteGameInvitationParamDto,
	) {
		const invitationId = deleteInvitationParamDto.gameInvitationId;
		const invitingUserId = deleteInvitationParamDto.cancelingUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitingUserId: invitingUserId,
			},
		});
		if (!invitation)
			throw new ImATeapotException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);

		// 초대 보낸 사람, 받은 사람 일치하는 초대 쌓인거 모두 삭제
		const deleteInvitationsDto: DeleteGameInvitationsParamDto = {
			invitingUserId: invitation.invitingUserId,
			invitedUserId: invitation.invitedUserId,
		};

		await this.gameInvitationRepository.deleteGameInvitaitons(
			deleteInvitationsDto,
		);
	}

	async deleteInvitationByInvitedUserId(
		deleteInvitationParamDto: DeleteGameInvitationParamDto,
	) {
		const invitationId = deleteInvitationParamDto.gameInvitationId;
		const invitedUserId = deleteInvitationParamDto.cancelingUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUserId,
			},
		});
		if (!invitation)
			throw new ImATeapotException(
				`해당하는 invitation id ${invitationId} 가 없습니다`,
			);

		// 초대 보낸 사람, 받은 사람 일치하는 초대 쌓인거 모두 삭제
		const deleteInvitationsDto: DeleteGameInvitationsParamDto = {
			invitingUserId: invitation.invitingUserId,
			invitedUserId: invitation.invitedUserId,
		};

		await this.gameInvitationRepository.deleteGameInvitaitons(
			deleteInvitationsDto,
		);

		// 초대 보낸 사람에게 초대가 거절됨을 알려야함
		// 초대 보낸 사람이 ONLINE 인지 확인
		const invitingUser = await this.checkUserExist(
			invitation.invitingUserId,
		);
		if (
			invitingUser.status === UserStatus.OFFLINE ||
			!invitingUser.channelSocketId
		)
			throw new ImATeapotException(
				`초대한 유저 ${invitingUser.id} 는 OFFLINE 상태입니다`,
			);

		const sendInvitationReplyDto: GatewaySendInvitationReplyDto = {
			targetUserChannelSocketId: invitingUser.channelSocketId,
			isAccepted: false,
			gameId: null,
		};

		await this.gameGateway.sendInvitationReply(sendInvitationReplyDto);
	}

	private async checkUserExist(userId: number): Promise<User> {
		const user = await this.usersRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new BadRequestException(`user ${userId} does not exist`);
		}
		return user as User;
	}
}
