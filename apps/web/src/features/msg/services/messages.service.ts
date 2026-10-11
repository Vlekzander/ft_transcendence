import type { MessageDTO } from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";

export async function getMessages(
	uuid: string,
): Promise<ApiResult<MessageDTO[]>> {
	try {
		const res = await fetch(`${API_URL}/msg/${uuid}`, {
			credentials: "include",
		});

		if (res.ok) {
			const data = await res.json();
			return { ok: true, data: data.messages ?? data };
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
