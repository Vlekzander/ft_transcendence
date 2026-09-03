import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginUserSchema, type LoginUserDTO } from "@ft_transcendence/shared";
import type { ApiResult } from "../../../shared/types/api";

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
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="border flex flex-col"
		>
			<h2>Login</h2>
			<p className="min-h-5 text-sm text-red-500">{serverError || " "}</p>
			<div>
				<label htmlFor="username">Username</label>
				<input id="username" {...register("username")} />
				<p className="min-h-5 text-sm text-red-500">
					{errors.username?.message || " "}
				</p>
			</div>
			<div>
				<label htmlFor="password">Password</label>
				<input
					id="password"
					type="password"
					{...register("password")}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.password?.message || " "}
				</p>
			</div>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Logging in..." : "Login"}
			</button>
		</form>
	);
}
