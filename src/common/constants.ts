// pagenation에서 한 페이지에 보여줄 데이터 개수
export const DEFAULT_PAGE_SIZE = 10;
export const GAME_DEFAULT_PAGE_SIZE = 5;

// 정규식
export const NICKNAME_REGEXP = /^[가-힣a-zA-Z0-9]*$/;
export const STATUS_MESSAGE_REGEXP = /^[ㄱ-ㅎ가-힣a-zA-Z0-9]*$/;

export const STATUS_MESSAGE_STRING = '^[ㄱ-ㅎ가-힣a-zA-Z0-9|\\s]*$';

export const CHANNEL_PASSWORD_REGEXP =
	/^[a-zA-Z0-9`~₩;'"!@#$%^&*()_+|<>?:{}]*$/;
export const CHANNEL_NAME_REGEXP = /^[가-힣a-zA-Z0-9]*$/;
