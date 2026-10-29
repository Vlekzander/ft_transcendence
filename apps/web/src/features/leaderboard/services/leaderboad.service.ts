import { LeaderboardEntry } from "@ft_transcendence/shared";
import { ApiResult } from "../../../shared/types/api";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import { API_URL } from "../../../config";

export async function getLeaderboard(): Promise<ApiResult<LeaderboardEntry[]>> {
	try {
		const res = await fetch(`${API_URL}/leaderboard`);

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.leaderboard ?? data };
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
