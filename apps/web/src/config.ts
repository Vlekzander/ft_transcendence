export const API_URL = import.meta.env.VITE_API_URL;
export const WS_URL = import.meta.env.VITE_WS_URL;

export const AVATARS_PATH =
	import.meta.env.MODE == "development" ? API_URL + "/avatars/" : "/avatars";
export const DEFAULT_AVATAR = "assets/default_avatar.jpg";
