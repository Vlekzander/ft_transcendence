import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditUserSchema, type EditUserDTO } from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { editUser } from "../services/editApi";
import type { ApiResult } from "../../../shared/types/api";
import { UserCheck } from "lucide-react";
import { useNavigate } from "react-router";

export default function EditAccountForm() {
	const navigate = useNavigate();
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
			email: user?.email,
			username: user?.username,
			password: "",
			confirmPassword: "",
			currentPassword: "",
		},
	});

	if (!user) {
		navigate("/");
		return;
	}

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
		<form onSubmit={handleSubmit(onSubmit)} className="form-card">
			<h2 className="form-title">
				<UserCheck className="text-primary" size={28} />
				Edit account
			</h2>
			{serverError && (
				<div className="form-alert-error">{serverError}</div>
			)}
			<div className="form-field">
				<label htmlFor="username" className="form-label">
					Username
				</label>
				<input
					id="username"
					className="form-input"
					{...register("username")}
				/>
				<p className="form-error">{errors.username?.message || " "}</p>
			</div>
			<div className="form-field">
				<label htmlFor="email" className="form-label">
					Email
				</label>
				<input
					id="email"
					type="email"
					className="form-input"
					{...register("email")}
				/>
				<p className="form-error">{errors.email?.message || " "}</p>
			</div>
			<div className="form-field">
				<label htmlFor="password" className="form-label">
					New password
				</label>
				<input
					id="password"
					type="password"
					placeholder="Optional"
					className="form-input"
					{...register("password")}
				/>
				<p className="form-error">{errors.password?.message || " "}</p>
			</div>
			<div className="form-field">
				<label htmlFor="confirmPassword" className="form-label">
					Confirm new password
				</label>
				<input
					id="confirmPassword"
					type="password"
					placeholder="Optional"
					className="form-input"
					{...register("confirmPassword")}
				/>
				<p className="form-error">
					{errors.confirmPassword?.message || " "}
				</p>
			</div>
			<div className="form-field">
				<label htmlFor="currentPassword" className="form-label">
					Current password
				</label>
				<input
					id="currentPassword"
					type="password"
					className="form-input"
					{...register("currentPassword")}
				/>
				<p className="form-error">
					{errors.currentPassword?.message || " "}
				</p>
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				className="btn-primary mt-2"
			>
				{isSubmitting ? "Editing..." : "Edit"}
			</button>
		</form>
	);
}
