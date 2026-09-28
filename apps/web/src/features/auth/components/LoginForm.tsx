import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginUserSchema, type LoginUserDTO } from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";
import { LogIn } from "lucide-react";

export default function LoginForm() {
	const { refreshUser } = useAuth();
	const navigate = useNavigate();

	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<LoginUserDTO>({
		resolver: zodResolver(LoginUserSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginUserDTO) => {
		setServerError("");

		const result: ApiResult = await loginUser(data);

		if (result.ok === true) {
			await refreshUser();
			navigate("/", { replace: true });
			return;
		}

		setServerError(result.error);

		if (result.errors) {
			for (const [field, message] of Object.entries(result.errors)) {
				if (field in data && typeof message === "string") {
					setError(field as keyof LoginUserDTO, {
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
				<LogIn className="text-primary" size={28} />
				Login
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
			<button
				type="submit"
				className="btn-primary mt-2"
				disabled={isSubmitting}
			>
				{isSubmitting ? "Logging in..." : "Login"}
			</button>
			<p className="text-sm text-gray-500 text-center mt-2">
				Don&apos;t have an account?{" "}
				<Link
					to="/register"
					className="font-semibold text-primary hover:underline"
				>
					Register
				</Link>
			</p>
		</form>
	);
}
