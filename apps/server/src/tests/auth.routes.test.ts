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

		it("POST should response an error with auth cookie", async () => {
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

		it("POST should response an error with duplicate username", async () => {
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

		it("POST should response an error with duplicate email", async () => {
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

		it("POST should response an error with invalid username", async () => {
			const data = {
				username: "u",
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("UsernameValidationError");
		});

		it("POST should response an error with invalid email", async () => {
			const data = {
				username: "user",
				email: "usergmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("EmailValidationError");
		});

		it("POST should response an error with invalid password", async () => {
			const data = {
				username: "user",
				email: "user@gmail.com",
				password: "pass",
				confirmPassword: "pass",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("PasswordValidationError");
		});

		it("POST should response an error with unmatch passwords", async () => {
			const data = {
				username: "user",
				email: "user@gmail.com",
				password: "password",
				confirmPassword: "wordpass",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe(
				"ConfirmPasswordValidationError",
			);
		});

		it("POST should response an error with missing username", async () => {
			const data = {
				email: "user@gmail.com",
				password: "password123",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("UsernameValidationError");
		});

		it("POST should response an error with missing email", async () => {
			const data = {
				username: "user",
				password: "password123",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("EmailValidationError");
		});

		it("POST should response an error with missing password", async () => {
			const data = {
				email: "user@gmail.com",
				username: "user",
				confirmPassword: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("PasswordValidationError");
		});

		it("POST should response an error with missing confirm password", async () => {
			const data = {
				email: "user@gmail.com",
				username: "user",
				password: "password123",
			};

			const response = await request(app)
				.post("/auth/register")
				.send(data)
				.set("Accept", "application/json");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe(
				"ConfirmPasswordValidationError",
			);
		});
	});
});
