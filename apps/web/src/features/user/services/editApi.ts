import type { EditUserDTO } from "@ft_transcendence/shared";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import type { ApiResult } from "../../../shared/types/api";

export async function editUser(
	uuid: string,
	data: EditUserDTO,
): Promise<ApiResult> {
	Object.keys(data).forEach((key) =>
		data[key] === "" ? delete data[key] : {},
	);
	try {
		const res = await fetch(`${API_URL}/users/${uuid}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
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
