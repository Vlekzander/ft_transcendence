import { ValidationError } from "@ft_transcendence/shared";
import { NextFunction, Response, Request } from "express";
import { ZodError, ZodObject, z } from "zod";

type ValidateOptions = {
	body?: ZodObject;
	params?: ZodObject;
	query?: ZodObject;
};

type inferZodType<T extends ZodObject> = z.infer<T>;

export type ParsedRequest<
	T extends ValidateOptions,
	FileT = Request["file"],
> = Request & {
	parsedBody?: T["body"] extends ZodObject
		? inferZodType<T["body"]>
		: unknown;
	parsedParams?: T["params"] extends ZodObject
		? inferZodType<T["params"]>
		: unknown;
	parsedQuery?: T["query"] extends ZodObject
		? inferZodType<T["query"]>
		: unknown;
	file?: FileT;
};

export function validate<T extends ValidateOptions, FileT = undefined>(
	options: T,
) {
	return (
		req: ParsedRequest<T, FileT>,
		_res: Response,
		next: NextFunction,
	) => {
		try {
			if (options.body) {
				const result = options.body.safeParse(req.body);
				if (!result.success) {
					const issue = result.error.issues[0];
					const field = String(issue?.path[0] ?? "body");
					return next(
						new ValidationError(
							field,
							issue?.message ?? "Invalid body",
						),
					);
				}
				req.parsedBody = result.data as inferZodType<
					NonNullable<T["body"]>
				>;
			}
			if (options.params) {
				const result = options.params.safeParse(req.params);
				if (!result.success) {
					const issue = result.error.issues[0];
					const field = String(issue?.path[0] ?? "params");
					return next(
						new ValidationError(
							field,
							issue?.message ?? "Invalid params",
						),
					);
				}
				req.parsedParams = result.data as inferZodType<
					NonNullable<T["params"]>
				>;
			}
			if (options.query) {
				const result = options.query.safeParse(req.query);
				if (!result.success) {
					const issue = result.error.issues[0];
					const field = String(issue?.path[0] ?? "query");
					return next(
						new ValidationError(
							field,
							issue?.message ?? "Invalid query",
						),
					);
				}
				req.parsedQuery = result.data as inferZodType<
					NonNullable<T["query"]>
				>;
			}

			next();
		} catch (err) {
			if (err instanceof ZodError) {
				const issue = err.issues[0];
				const field = String(issue?.path[0] ?? "input");
				return next(
					new ValidationError(
						field,
						issue?.message ?? "Invalid input",
					),
				);
			}
			next(err);
		}
	};
}
