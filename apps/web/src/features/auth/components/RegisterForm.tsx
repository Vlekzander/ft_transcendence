import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, type AuthResult } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	RegisterUserSchema,
	type RegisterUserDTO,
} from "@ft_transcendence/shared";

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

		const result: AuthResult = await registerUser(data);

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
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="border flex flex-col"
		>
			<h2>Register</h2>
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
			<div>
				<label htmlFor="confirmPassword">Confirm password</label>
				<input
					id="confirmPassword"
					type="password"
					{...register("confirmPassword")}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.confirmPassword?.message || " "}
				</p>
			</div>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Registering..." : "Register"}
			</button>
		</form>
	);
}
