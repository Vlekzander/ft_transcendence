import type {
	FriendshipDTO,
	PendingFriendRequestDTO,
	PublicUserDTO,
	SentFriendRequestDTO,
} from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import { API_URL } from "../../../config";

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

export async function sendFriendRequest(
	uuid: string,
	target: string,
): Promise<ApiResult> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ receiverId: target }),
			credentials: "include",
		});

		if (res.ok) return { ok: true };

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function getPendingRequests(
	uuid: string,
): Promise<ApiResult<PendingFriendRequestDTO[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends/pending`, {
			credentials: "include",
		});

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.pendingRequests ?? data };
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

export async function getSentRequests(
	uuid: string,
): Promise<ApiResult<SentFriendRequestDTO[]>> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends/sent`, {
			credentials: "include",
		});

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.sentRequests ?? data };
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

export async function acceptFriendRequest(
	uuid: string,
	request: string,
): Promise<ApiResult> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ requestId: request }),
			credentials: "include",
		});

		if (res.ok) return { ok: true };

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function deleteFriendRequest(
	uuid: string,
	request: string,
): Promise<ApiResult> {
	try {
		const res = await fetch(`${API_URL}/users/${uuid}/friends`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ requestId: request }),
			credentials: "include",
		});

		if (res.ok) return { ok: true };

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function searchUserRequest(
	query: string,
): Promise<ApiResult<PublicUserDTO[]>> {
	try {
		const res = await fetch(`${API_URL}/users?query=${query}`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.users ?? data };
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
