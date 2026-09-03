import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditUserSchema, type EditUserDTO } from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { editUser } from "../services/editApi";
import type { ApiResult } from "../../../shared/types/api";

export default function EditAccountForm() {
	const { user, refreshUser } = useAuth();

	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<EditUserDTO>({
		resolver: zodResolver(EditUserSchema),
		defaultValues: {
			email: user.email,
			username: user.username,
			password: "",
			confirmPassword: "",
			currentPassword: "",
		},
	});

	const onSubmit = async (data: EditUserDTO) => {
		setServerError("");

		if (
			data.username === user.username &&
			data.email === user.email &&
			data.password === ""
		)
			return setServerError("No changes to save");
		if (data.username === user.username) delete data["username"];
		if (data.email === user.email) delete data["email"];
		const result: ApiResult = await editUser(user.uuid, data);

		if (result.ok === true) {
			await refreshUser();
			return;
		}

		setServerError(result.error);

		if (result.errors) {
			for (const [field, message] of Object.entries(result.errors)) {
				if (field in data && typeof message === "string") {
					setError(field as keyof EditUserDTO, {
						type: "server",
						message,
					});
				}
			}
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="border flex flex-col"
		>
			<h2>Edit account</h2>
			<p className="min-h-5 text-sm text-red-500">{serverError || " "}</p>
			<div>
				<label htmlFor="username">Username</label>
				<input id="username" {...register("username")} />
				<p className="min-h-5 text-sm text-red-500">
					{errors.username?.message || " "}
				</p>
			</div>
			<div>
				<label htmlFor="email">Email</label>
				<input id="email" type="email" {...register("email")} />
				<p className="min-h-5 text-sm text-red-500">
					{errors.email?.message || " "}
				</p>
			</div>
			<div>
				<label htmlFor="password">New password</label>
				<input
					id="password"
					type="password"
					placeholder="Optional"
					{...register("password")}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.password?.message || " "}
				</p>
			</div>
			<div>
				<label htmlFor="confirmPassword">Confirm new password</label>
				<input
					id="confirmPassword"
					type="password"
					placeholder="Optional"
					{...register("confirmPassword")}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.confirmPassword?.message || " "}
				</p>
			</div>
			<div>
				<label htmlFor="currentPassword">Current password</label>
				<input
					id="currentPassword"
					type="password"
					{...register("currentPassword")}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.currentPassword?.message || " "}
				</p>
			</div>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Editing..." : "Edit"}
			</button>
		</form>
	);
}
