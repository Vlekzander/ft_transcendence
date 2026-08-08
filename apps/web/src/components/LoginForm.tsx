import { useState } from "react";
import {
	parseLoginUserNoThrow,
	ValidationError,
} from "@ft_transcendence/shared";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../utils/api.utils";

const errorFieldMap = {
	UsernameValidationError: "username",
	PasswordValidationError: "password",
} as const;

type ErrorField = (typeof errorFieldMap)[keyof typeof errorFieldMap];

type LoginErrors = Partial<Record<ErrorField, string>>;

function mapValidationErrors(errors: ValidationError[]): LoginErrors {
	const nextErrors: LoginErrors = {};
	for (const err of errors) {
		const field = errorFieldMap[err.name as keyof typeof errorFieldMap];
		if (field) nextErrors[field] = err.message;
	}
	return nextErrors;
}

export default function LoginForm() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const [errors, setErrors] = useState<LoginErrors>({});
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

		try {
			setLoading(true);
			setErrors({});
			setError("");
			const result = parseLoginUserNoThrow(formData);
			if (Array.isArray(result)) {
				setErrors(mapValidationErrors(result));
				return;
			}

			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(result),
			});
			if (res.ok) navigate("/", { replace: true });
			else setError(await getApiErrorMessage(res));
		} catch (err) {
			setError(err instanceof Error ? err.message : DEFAULT_ERROR);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="border flex flex-col">
			<h2>Login</h2>
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
			<button type="submit" disabled={loading}>
				{loading ? "Login..." : "Login"}
			</button>
		</form>
	);
}
