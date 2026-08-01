import { ErrorRequestHandler } from "express";
import { mapError } from "../errors/request.errors";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
	if (res.headersSent) return next(err);

	const mapped = mapError(err);

	return res
		.status(mapped.status)
		.json({
			succes: false,
			error: { code: mapped.code, message: mapped.message },
		});
};
