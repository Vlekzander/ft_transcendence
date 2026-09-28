import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	RegisterUserSchema,
	type RegisterUserDTO,
} from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";
import { UserPlus } from "lucide-react";

export default function RegisterForm() {
	const { refreshUser } = useAuth();
	const navigate = useNavigate();

	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<RegisterUserDTO>({
		resolver: zodResolver(RegisterUserSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: RegisterUserDTO) => {
		setServerError("");

		const result: ApiResult = await registerUser(data);

		if (result.ok === true) {
			await refreshUser();
			navigate("/", { replace: true });
			return;
		}

		setServerError(result.error);

		if (result.errors) {
			for (const [field, message] of Object.entries(result.errors)) {
				if (field in data && typeof message === "string") {
					setError(field as keyof RegisterUserDTO, {
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
				<UserPlus className="text-primary" size={28} />
				Register
			</h2>
			{serverError && (
				<p className="form-alert-error">{serverError || " "}</p>
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
					Password
				</label>
				<input
					id="password"
					type="password"
					className="form-input"
					{...register("password")}
				/>
				<p className="form-error">{errors.password?.message || " "}</p>
			</div>
			<div className="form-field">
				<label htmlFor="confirmPassword" className="form-label">
					Confirm password
				</label>
				<input
					id="confirmPassword"
					type="password"
					className="form-input"
					{...register("confirmPassword")}
				/>
				<p className="form-error">
					{errors.confirmPassword?.message || " "}
				</p>
			</div>
			<button
				type="submit"
				className="btn-primary mt-2"
				disabled={isSubmitting}
			>
				{isSubmitting ? "Registering..." : "Register"}
			</button>
			<p className="text-sm text-gray-500 text-center mt-2">
				Already have an account?{" "}
				<Link
					to="/login"
					className="font-semibold text-primary hover:underline"
				>
					Login
				</Link>
			</p>
		</form>
	);
}
