import { prisma } from "../lib/prisma.lib";
import app from "../app";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { generateAccessToken } from "../utils/jwt.util";

describe("auth.routes", () => {
	beforeEach(async () => {
		await prisma.user.deleteMany({});
	});

	describe("/auth/register", () => {
		const invalidCases = [
			{
				name: "missing username",
				data: {
					email: "user@gmail.com",
					password: "password123",
					confirmPassword: "password123",
				},
				code: 400,
				error: "UsernameValidationError",
			},
			{
				name: "missing email",
				data: {
					username: "user",
					password: "password123",
					confirmPassword: "password123",
				},
				code: 400,
				error: "EmailValidationError",
			},
			{
				name: "missing password",
				data: {
					username: "user",
					email: "user@gmail.com",
					confirmPassword: "password123",
				},
				code: 400,
				error: "PasswordValidationError",
			},
			{
				name: "missing confirm password",
				data: {
					username: "user",
					email: "user@gmail.com",
					password: "password123",
				},
				code: 400,
				error: "ConfirmPasswordValidationError",
			},
			{
				name: "invalid username",
				data: {
					username: "u",
					email: "user@gmail.com",
					password: "password123",
					confirmPassword: "password123",
				},
				code: 400,
				error: "UsernameValidationError",
			},
			{
				name: "invalid email",
				data: {
					username: "user",
					email: "usergmail.com",
					password: "password123",
					confirmPassword: "password123",
				},
				code: 400,
				error: "EmailValidationError",
			},
			{
				name: "invalid password",
				data: {
					username: "user",
					email: "user@gmail.com",
					password: "pass",
					confirmPassword: "pass",
				},
				code: 400,
				error: "PasswordValidationError",
			},
			{
				name: "unmatch passwords",
				data: {
					username: "user",
					email: "user@gmail.com",
					password: "password123",
					confirmPassword: "password456",
				},
				code: 400,
				error: "ConfirmPasswordValidationError",
			},
		];

		it("POST should register user", async () => {
			const data = {
				username: "user",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(201);
			expect(response.body.data?.username).toBe(data.username);
			expect(response.body.data?.email).toBe(data.email);
			expect(response.body.data?.avatarUuid).toBeNull();
		});

		it("POST should fail when already authenticated", async () => {
			const data = {
				username: "user",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			const token = generateAccessToken("none");
			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json")
				.set("Cookie", [`token=${token}`]);

			expect(response.status).toBe(403);
			expect(response.body?.error.code).toBe("AlreadyAuthError");
		});

		it.each(invalidCases)(
			"POST should fail with $name",
			async ({ data, code, error }) => {
				const response = await request(app)
					.post("/auth/register")
					.send(data)
					.set("Accept", "application/json");

				expect(response.status).toBe(code);
				expect(response.body?.error.code).toBe(error);
			},
		);

		it("POST should fail with duplicated username", async () => {
			const first = {
				username: "user",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};
			const second = {
				username: "user",
				email: "another@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			await request(app)
				.post("/auth/register")
				.send(first)
				.set("Accept", "application/json");
			const response = await request(app)
				.post("/auth/register")
				.send(second)
				.set("Accept", "application/json");

			expect(response.status).toBe(409);
			expect(response.body?.error.code).toBe("DuplicateUsernameError");
		});

		it("POST should fail duplicated email", async () => {
			const first = {
				username: "another",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};
			const second = {
				username: "user",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			await request(app)
				.post("/auth/register")
				.send(first)
				.set("Accept", "application/json");
			const response = await request(app)
				.post("/auth/register")
				.send(second)
				.set("Accept", "application/json");

			expect(response.status).toBe(409);
			expect(response.body?.error.code).toBe("DuplicateEmailError");
		});
	});
});
