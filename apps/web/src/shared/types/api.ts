export type ApiSuccess<T = void> = T extends void
	? { ok: true }
	: { ok: true; data: T };

export type ApiFailure = {
	ok: false;
	error: string;
	errors?: Record<string, string>;
};

export type ApiResult<T = void> = ApiSuccess<T> | ApiFailure;
