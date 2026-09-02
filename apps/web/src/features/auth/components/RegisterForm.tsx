import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RegisterUserDTO } from "@ft_transcendence/shared";
import {
	registerUser,
	type AuthErrors,
	type AuthResult,
} from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function RegisterForm() {
	const { refreshUser } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState<RegisterUserDTO>({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<AuthErrors>({});
	const [error, setError] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		setLoading(true);
		setErrors({});
		setError("");

		const result: AuthResult = await registerUser(formData);

		if (result.ok === true) {
			await refreshUser();
			navigate("/", { replace: true });
		} else {
			setError(result.error);
			if (result.errors) setErrors(result.errors);
		}
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="border flex flex-col">
			<h2>Register</h2>
			<p className="min-h-5 text-sm text-red-500">{error || " "}</p>
			<div>
				<label htmlFor="username">Username </label>
				<input
					id="username"
					name="username"
					type="text"
					required
					value={formData.username}
					onChange={handleChange}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.username || " "}
				</p>
			</div>
			<div>
				<label htmlFor="email">Email </label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					value={formData.email}
					onChange={handleChange}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.email || " "}
				</p>
			</div>
			<div>
				<label htmlFor="password">Password </label>
				<input
					id="password"
					name="password"
					type="password"
					required
					value={formData.password}
					onChange={handleChange}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.password || " "}
				</p>
			</div>
			<div>
				<label htmlFor="confirmPassword">Confirm password </label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					value={formData.confirmPassword}
					onChange={handleChange}
				/>
				<p className="min-h-5 text-sm text-red-500">
					{errors.confirmPassword || " "}
				</p>
			</div>
			<button type="submit" disabled={loading}>
				{loading ? "Register..." : "Register"}
			</button>
		</form>
	);
}
