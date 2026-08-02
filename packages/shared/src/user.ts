import z from "zod";

export const UserResponseSchema = z.object({
	uuid: z.string(),
	email: z.email(),
	username: z.string(),
	avatarUuid: z.string().nullable(),
});

export const CreateUserSchema = z
	.object({
		email: z.email(),
		username: z.string().min(3).max(20),
		password: z.string().min(8),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "The password and confirmation do not match",
		path: ["confirmPassword"],
	});

export type UserResponseDTO = z.infer<typeof UserResponseSchema>;
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
