import type {
	CreateLobbyDTO,
	LobbyResponseDTO,
	UpdateLobbyDTO,
} from "@ft_transcendence/shared";
import type { ApiFailure, ApiResult } from "../../../shared/types/api";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import { API_URL } from "../../../config";

export type LobbyApiFailure = ApiFailure & { status?: number };
export type LobbyApiResult<T = void> =
	| Exclude<ApiResult<T>, ApiFailure>
	| LobbyApiFailure;

async function lobbyRequest<T = void>(
	path: string,
	method: "GET" | "POST" | "PUT" = "GET",
	body?: unknown,
): Promise<LobbyApiResult<T>> {
	try {
		const res = await fetch(`${API_URL}/lobbies${path}`, {
			method,
			headers: body ? { "Content-Type": "application/json" } : undefined,
			body: body ? JSON.stringify(body) : undefined,
			credentials: "include",
		});

		if (res.ok) {
			const json = await res.json();
			return { ok: true, data: json.data } as LobbyApiResult<T>;
		}

		return {
			ok: false,
			error: await getApiErrorMessage(res),
			status: res.status,
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export const listLobbies = () => lobbyRequest<LobbyResponseDTO[]>("");

export const getLobby = (uuid: string) =>
	lobbyRequest<LobbyResponseDTO>(`/${uuid}`);

export const getMyLobby = () => lobbyRequest<LobbyResponseDTO | null>("/me");

export const createLobby = (data: CreateLobbyDTO) =>
	lobbyRequest<LobbyResponseDTO>("", "POST", data);

export const joinLobby = (joinCode: string) =>
	lobbyRequest<LobbyResponseDTO>("/join", "POST", { joinCode });

export const leaveLobby = (uuid: string) =>
	lobbyRequest(`/${uuid}/leave`, "POST");

export const toggleLobbyReady = (uuid: string) =>
	lobbyRequest<LobbyResponseDTO>(`/${uuid}/ready`, "POST");

export const startLobbyGame = (uuid: string) =>
	lobbyRequest<LobbyResponseDTO>(`/${uuid}/start`, "POST");

export const updateLobbySettings = (uuid: string, data: UpdateLobbyDTO) =>
	lobbyRequest<LobbyResponseDTO>(`/${uuid}/settings`, "PUT", data);

export const banPlayer = (uuid: string, userId: string) =>
	lobbyRequest(`/${uuid}/ban`, "POST", { userId });

export const unbanPlayer = (uuid: string, userId: string) =>
	lobbyRequest(`/${uuid}/unban`, "POST", { userId });
