import z from "zod";

export const UserResponseSchema = z.object({
	uuid: z.string(),
	email: z.email(),
	username: z.string(),
	avatarUuid: z.string().nullable(),
});

const emailSchema = z.email("Invalid email address");
const usernameSchema = z
	.string()
	.min(3, "Username must be at least 3 characters")
	.max(20, "Username must be at most 20 characters")
	.regex(
		/^[A-Za-z0-9_-]+$/,
		"Username can only contain letters, numbers, underscores and hyphens",
	);
const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/[0-9]/, "Password must contain at least one number");

export const RegisterUserSchema = z
	.object({
		email: emailSchema,
		username: usernameSchema,
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "The password and confirmation do not match",
		path: ["confirmPassword"],
	});

export const LoginUserSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
});

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;
export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;
export type LoginUserDTO = z.infer<typeof LoginUserSchema>;
