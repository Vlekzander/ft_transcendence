export const WS_URL = import.meta.env.VITE_WS_URL;

export const API_URL = "/api";
export const AVATARS_PATH = "/avatars";
export const DEFAULT_AVATAR = "/assets/default_avatar.jpg";

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	return "Unknown error";
}

export function getAvatarUrl(avatarPath: string | null) {
	if (!avatarPath) return DEFAULT_AVATAR;
	return `${AVATARS_PATH}/${avatarPath}`;
}
