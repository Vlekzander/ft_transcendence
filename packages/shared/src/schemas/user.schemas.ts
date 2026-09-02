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

const confirmPasswordSchema = z.string().min(1, "Please confirm your password");

export const RegisterUserSchema = z
	.object({
		email: emailSchema,
		username: usernameSchema,
		password: passwordSchema,
		confirmPassword: confirmPasswordSchema,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "The password and confirmation do not match",
		path: ["confirmPassword"],
	});

export const LoginUserSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
});

export const EditUserSchema = z
	.object({
		email: emailSchema,
		username: usernameSchema,
		password: z.string().optional(),
		confirmPassword: z.string().optional(),
		currentPassword: passwordSchema,
	})
	.refine(
		(data) => {
			if (!data.password) return true;
			return passwordSchema.safeParse(data.password).success;
		},
		{
			message:
				"Password must be at least 8 characters, include uppercase, lowercase and a number",
			path: ["password"],
		},
	)
	.refine(
		(data) => {
			if (!data.password && !data.confirmPassword) return true;
			return data.password === data.confirmPassword;
		},
		{
			message: "The password and confirmation do not match",
			path: ["confirmPassword"],
		},
	);

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;
export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;
export type LoginUserDTO = z.infer<typeof LoginUserSchema>;
export type EditUserDTO = z.infer<typeof EditUserSchema>;
