export enum UserStatus {
	ONLINE = 'ONLINE',
	OFFLINE = 'OFFLINE',
	INGAME = 'INGAME',
}

export enum GameType {
	LADDER = 'LADDER',
	NORMAL_MATCHING = 'NORMAL_MATCHING',
	NORMAL_INVITE = 'NORMAL_INVITE',
	SPECIAL_MATCHING = 'SPECIAL_MATCHING',
	SPECIAL_INVITE = 'SPECIAL_INVITE',
}

export enum GameStatus {
	WAITING = 'WAITING',
	PLAYING = 'PLAYING',
	FINISHED = 'FINISHED',
}

export enum ChannelType {
	PUBLIC = 'PUBLIC',
	PROTECTED = 'PROTECTED',
	PRIVATE = 'PRIVATE',
	DM = 'DM',
}

export enum ChannelUserType {
	OWNER = 'OWNER',
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER',
}

export enum ChannelEventType {
	JOIN = 'JOIN',
	BAN = 'BAN',
	EXIT = 'EXIT',
	KICK = 'KICK',
	MUTE = 'MUTE',
	ADMIN = 'ADMIN',
	ADMIN_CANCEL = 'ADMIN_CANCEL',
}
