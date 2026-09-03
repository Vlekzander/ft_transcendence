import {
	type LoginUserDTO,
	type RegisterUserDTO,
} from "@ft_transcendence/shared";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import type { ApiResult } from "../../../shared/types/api";

async function authUser(
	input: RegisterUserDTO | LoginUserDTO,
	path: string,
): Promise<ApiResult> {
	try {
		const res = await fetch(`${API_URL}/auth/${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
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

export async function registerUser(input: RegisterUserDTO): Promise<ApiResult> {
	return authUser(input, "register");
}

export async function loginUser(input: LoginUserDTO): Promise<ApiResult> {
	return authUser(input, "login");
}
