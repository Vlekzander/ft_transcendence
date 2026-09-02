import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, type AuthResult } from "../services/authApi";
import type { LoginUserDTO } from "@ft_transcendence/shared";
import { useAuth } from "../context/AuthContext";
import type { ValidationErrors } from "../../../shared/types/ValidationTypes";

export default function LoginForm() {
	const { refreshUser } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState<LoginUserDTO>({
		username: "",
		password: "",
	});
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

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

		const result: AuthResult = await loginUser(formData);

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
			<h2>Login</h2>
			<p className="min-h-5 text-sm text-red-500">{error || " "}</p>
			<div>
				<label htmlFor="username">Username</label>
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
				<label htmlFor="password">Password</label>
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
			<button type="submit" disabled={loading}>
				{loading ? "Logging in..." : "Login"}
			</button>
		</form>
	);
}
