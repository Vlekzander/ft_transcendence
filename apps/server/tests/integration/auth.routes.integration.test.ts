import { assertTestDatabase } from "./database";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@/lib/prisma.lib";
import app from "@/app";

describe("auth routes", () => {
	beforeAll(async () => {
		await prisma.$connect();
	});

	beforeEach(async () => {
		assertTestDatabase();
		await prisma.user.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe("POST /auth/register", () => {
		it("Registers a valid user and returns HTTP 201", async () => {
			// Arrange
			const payload = {
				email: "user@email.com",
				username: "user",
				password: "Password123!",
				confirmPassword: "Password123!",
			};

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(payload);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				data: expect.objectContaining({
					email: payload.email,
					username: payload.username,
					avatarPath: null,
					uuid: expect.any(String),
				}),
			});
			expect(response.headers["set-cookie"]).toBeDefined();

			const databaseUser = await prisma.user.findUnique({
				where: {
					username: payload.username,
				},
			});

			expect(databaseUser).not.toBeNull();
			expect(databaseUser?.email).toBe(payload.email);
			expect(databaseUser?.password).not.toBe(payload.password);
		});

		it("Rejects an invalid registration body with HTTP 400", async () => {
			// Arrange
			const payload = {
				email: "invalid-email",
				username: "",
				password: "",
				confirmPassword: "",
			};

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(payload);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: {
					code: expect.any(String),
					message: expect.any(String),
				},
			});
		});

		it("Rejects a duplicate email with HTTP 409", async () => {
			// Arrange
			const payload = {
				email: "user@email.com",
				username: "first-user",
				password: "Password123!",
				confirmPassword: "Password123!",
			};

			await request(app).post("/auth/register").send(payload).expect(201);

			// Act
			const response = await request(app).post("/auth/register").send({
				email: payload.email,
				username: "second-user",
				password: "Password123!",
				confirmPassword: "Password123!",
			});

			// Assert
			expect(response.status).toBe(409);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("Rejects a duplicate username with HTTP 409", async () => {
			// Arrange
			const payload = {
				email: "first@email.com",
				username: "same-username",
				password: "Password123!",
				confirmPassword: "Password123!",
			};

			await request(app).post("/auth/register").send(payload).expect(201);

			// Act
			const response = await request(app).post("/auth/register").send({
				email: "second@email.com",
				username: payload.username,
				password: "Password123!",
				confirmPassword: "Password123!",
			});

			// Assert
			expect(response.status).toBe(409);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("POST /auth/login", () => {
		it("Logs in with valid credentials and returns HTTP 200", async () => {
			// Arrange
			const payload = {
				email: "user@email.com",
				username: "user",
				password: "Password123!",
				confirmPassword: "Password123!",
			};

			await request(app).post("/auth/register").send(payload).expect(201);

			// Act
			const response = await request(app).post("/auth/login").send({
				username: payload.username,
				password: payload.password,
			});

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: {
					uuid: expect.any(String),
					email: payload.email,
					username: payload.username,
					avatarPath: null,
				},
			});
			expect(response.headers["set-cookie"]).toBeDefined();
		});

		it("Rejects an unknown username with HTTP 401", async () => {
			// Arrange
			const payload = {
				username: "unknown-user",
				password: "Password123!",
			};

			// Act
			const response = await request(app)
				.post("/auth/login")
				.send(payload);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("Rejects an incorrect password with HTTP 401", async () => {
			// Arrange
			await request(app)
				.post("/auth/register")
				.send({
					email: "user@email.com",
					username: "user",
					password: "Password123!",
					confirmPassword: "Password123!",
				})
				.expect(201);

			// Act
			const response = await request(app).post("/auth/login").send({
				username: "user",
				password: "WrongPassword123!",
			});

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("Rejects an authenticated user from logging in again", async () => {
			// Arrange
			const agent = request.agent(app);

			await agent
				.post("/auth/register")
				.send({
					email: "user@email.com",
					username: "user",
					password: "Password123!",
					confirmPassword: "Password123!",
				})
				.expect(201);

			// Act
			const response = await agent.post("/auth/login").send({
				username: "user",
				password: "Password123!",
			});

			// Assert
			expect(response.status).toBe(403);
		});
	});

	describe("POST /auth/logout", () => {
		it("Rejects logout without authentication", async () => {
			// Arrange
			// No authenticated session is created.

			// Act
			const response = await request(app).post("/auth/logout");

			// Assert
			expect(response.status).toBe(401);
		});

		it("Logs out an authenticated user with HTTP 204", async () => {
			// Arrange
			const agent = request.agent(app);

			await agent
				.post("/auth/register")
				.send({
					email: "user@email.com",
					username: "user",
					password: "Password123!",
					confirmPassword: "Password123!",
				})
				.expect(201);

			// Act
			const response = await agent.post("/auth/logout");

			// Assert
			expect(response.status).toBe(204);
		});
	});

	describe("GET /auth/whoami", () => {
		it("Returns unauthenticated when no token exists", async () => {
			// Arrange
			// No authentication cookie is sent.

			// Act
			const response = await request(app).get("/auth/whoami");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				authenticated: false,
			});
		});

		it("Returns the authenticated user with HTTP 200", async () => {
			// Arrange
			const agent = request.agent(app);

			await agent
				.post("/auth/register")
				.send({
					email: "user@email.com",
					username: "user",
					password: "Password123!",
					confirmPassword: "Password123!",
				})
				.expect(201);

			// Act
			const response = await agent.get("/auth/whoami");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				authenticated: true,
				user: {
					uuid: expect.any(String),
					email: "user@email.com",
					username: "user",
					avatarPath: null,
				},
			});
		});

		it("Returns unauthenticated after logout", async () => {
			// Arrange
			const agent = request.agent(app);

			await agent
				.post("/auth/register")
				.send({
					email: "user@email.com",
					username: "user",
					password: "Password123!",
					confirmPassword: "Password123!",
				})
				.expect(201);

			await agent.post("/auth/logout").expect(204);

			// Act
			const response = await agent.get("/auth/whoami");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				authenticated: false,
			});
		});
	});
});
