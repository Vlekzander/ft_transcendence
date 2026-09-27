import type {
	Achievement,
	FriendshipDTO,
	GameHistoryEntry,
	PublicUserDTO,
	Stat,
} from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";

export async function getUser(uuid: string): Promise<ApiResult<PublicUserDTO>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.user ?? data };
		}

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function getHistory(
	uuid: string,
): Promise<ApiResult<GameHistoryEntry[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/history`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.history ?? data };
		}

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function getStats(uuid: string): Promise<ApiResult<Stat[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/stats`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.stats ?? data };
		}

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function getAchievements(
	uuid: string,
): Promise<ApiResult<Achievement[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/achievements`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.achievements ?? data };
		}

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function getFriends(
	uuid: string,
): Promise<ApiResult<FriendshipDTO[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.friends ?? data };
		}

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}
