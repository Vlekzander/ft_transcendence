import z from "zod";

// OUTPUTS SCHEMAS

export const UserResponseSchema = z.object({
	uuid: z.string(),
	email: z.email(),
	username: z.string(),
	avatarPath: z.string().nullable(),
});

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;

export const PublicUserSchema = z.object({
	uuid: z.string(),
	username: z.string(),
	avatarPath: z.string().nullable(),
	online: z.boolean(),
});

export type PublicUserDTO = z.infer<typeof PublicUserSchema>;

export const FriendshipResponseSchema = z.object({
	sender: PublicUserSchema,
	receiver: PublicUserSchema,
	status: z.enum(["PENDING", "ACCEPTED"]),
	createdAt: z.date(),
});

export type FriendshipResponseDTO = z.infer<typeof FriendshipResponseSchema>;

// INPUTS SCHEMAS

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

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
});

export type LoginUserDTO = z.infer<typeof LoginUserSchema>;

export const EditUserSchema = z
	.object({
		email: emailSchema.optional(),
		username: usernameSchema.optional(),
		password: z.string().optional(),
		confirmPassword: z.string().optional(),
		currentPassword: z.string("Current password is missing"),
	})
	.refine(
		(data) => {
			if (!data.password) return true;
			const result = passwordSchema.safeParse(data.password);
			return result.success;
		},
		{
			message:
				"Minimum 8 characters: 1 uppercase, 1 lowercase, and 1 number required",
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

export type EditUserDTO = z.infer<typeof EditUserSchema>;

export const UserParamsSchema = z.object({
	uuid: z.string().min(1, "UUID is required"),
});

export type UserParamsDTO = z.infer<typeof UserParamsSchema>;

export const CreateFriendshipSchema = z.object({
	receiverId: z.string(),
});

export type CreateFriendshipDTO = z.infer<typeof CreateFriendshipSchema>;

export const EditFriendshipSchema = z.object({
	requestId: z.string(),
});

export type EditFriendshipDTO = z.infer<typeof CreateFriendshipSchema>;
