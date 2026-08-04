import { useState } from "react";
import {
	parseRegisterUserNoThrow,
	ValidationError,
} from "@ft_transcendence/shared";
import { useNavigate } from "react-router";

const errorFieldMap = {
	UsernameValidationError: "username",
	EmailValidationError: "email",
	PasswordValidationError: "password",
	ConfirmPasswordValidationError: "confirmPassword",
};

type ErrorField = (typeof errorFieldMap)[keyof typeof errorFieldMap];

type RegisterErrors = Partial<Record<ErrorField, string>>;

export default function RegisterForm() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const [errors, setErrors] = useState<RegisterErrors>({});
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

		try {
			setErrors({});
			setError("");
			const result = parseRegisterUserNoThrow(formData);
			if (Array.isArray(result)) {
				const nextErrors: RegisterErrors = {};
				for (const err of result as ValidationError[]) {
					const field =
						errorFieldMap[err.name as keyof typeof errorFieldMap];
					if (field) nextErrors[field] = err.message;
				}
				setErrors(nextErrors);
				return;
			}
			const res = await fetch("http://localhost:3000/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(result),
			});

			if (res.ok) {
				navigate("/", { replace: true });
				return;
			}
			const err = await res.json();
			setError(err?.error.message);
		} catch (err) {
			setError(err?.message);
			return;
		}
	};

	return (
		<div className="grow flex items-center justify-center">
			<form onSubmit={handleSubmit} className="border flex flex-col">
				<h2>Register</h2>
				<p className="min-h-5 text-sm text-red-500"> {error ?? " "} </p>
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
						{" "}
						{errors.username ?? " "}{" "}
					</p>
				</div>
				<div>
					<label htmlFor="email">Email </label>
					<input
						id="email"
						name="email"
						type="text"
						required
						value={formData.email}
						onChange={handleChange}
					/>
					<p className="min-h-5 text-sm text-red-500">
						{" "}
						{errors.email ?? " "}{" "}
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
						{" "}
						{errors.password ?? " "}{" "}
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
						{" "}
						{errors.confirmPassword ?? " "}{" "}
					</p>
				</div>
				<button type="submit">Register</button>
			</form>
		</div>
	);
}
