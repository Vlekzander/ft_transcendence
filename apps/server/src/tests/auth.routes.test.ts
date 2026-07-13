import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("auth routes", () => {
	describe("POST /auth/register", () => {
		it("Registers a user and returns 201 with the full user DTO", async () => {
			const res = await request(app).post("/auth/register").send({
				email: "register1@example.com",
				username: "register1",
				password: "secret123",
			});

			expect(res.status).toBe(201);
			expect(res.body.uuid).toBeTypeOf("string");
			expect(res.body.email).toBe("register1@example.com");
			expect(res.body.username).toBe("register1");
			expect(res.body.role).toBe(0);
			expect(res.body.banned).toBe(false);
			expect(res.body.avatarUuid).toBeNull();
			expect(res.body.createdAt).toBeTypeOf("string");
			expect(res.body.passwordHash).toBeUndefined();
		});

		it("Returns 400 for an invalid email", async () => {
			const res = await request(app).post("/auth/register").send({
				email: "not-an-email",
				username: "register2",
				password: "secret123",
			});

			expect(res.status).toBe(400);
		});

		it("Returns 400 for a password that is too short", async () => {
			const res = await request(app).post("/auth/register").send({
				email: "register3@example.com",
				username: "register3",
				password: "short",
			});

			expect(res.status).toBe(400);
		});

		it("Returns 409 when the email is already registered", async () => {
			await request(app).post("/auth/register").send({
				email: "dupe@example.com",
				username: "dupeuser1",
				password: "secret123",
			});

			const res = await request(app).post("/auth/register").send({
				email: "dupe@example.com",
				username: "dupeuser2",
				password: "secret123",
			});

			expect(res.status).toBe(409);
		});

		it("Returns 409 when the username is already registered", async () => {
			await request(app).post("/auth/register").send({
				email: "dupename1@example.com",
				username: "dupename",
				password: "secret123",
			});

			const res = await request(app).post("/auth/register").send({
				email: "dupename2@example.com",
				username: "dupename",
				password: "secret123",
			});

			expect(res.status).toBe(409);
		});

		it("Returns 409 when already authenticated", async () => {
			await request(app).post("/auth/register").send({
				email: "guarded1@example.com",
				username: "guarded1",
				password: "secret123",
			});
			const loginRes = await request(app).post("/auth/login").send({
				email: "guarded1@example.com",
				password: "secret123",
			});

			const res = await request(app)
				.post("/auth/register")
				.set("Cookie", loginRes.headers["set-cookie"])
				.send({
					email: "guarded2@example.com",
					username: "guarded2",
					password: "secret123",
				});

			expect(res.status).toBe(409);
		});
	});

	describe("POST /auth/login", () => {
		it("Logs in with valid credentials, sets a token cookie and returns the full user DTO", async () => {
			await request(app).post("/auth/register").send({
				email: "login1@example.com",
				username: "login1",
				password: "secret123",
			});

			const res = await request(app).post("/auth/login").send({
				email: "login1@example.com",
				password: "secret123",
			});

			expect(res.status).toBe(200);
			expect(res.body.uuid).toBeTypeOf("string");
			expect(res.body.email).toBe("login1@example.com");
			expect(res.body.username).toBe("login1");
			expect(res.body.role).toBe(0);
			expect(res.body.avatarUuid).toBeNull();
			expect(res.body.createdAt).toBeTypeOf("string");
			const cookies = res.get("Set-Cookie") ?? [];
			expect(cookies.some((cookie) => cookie.startsWith("token="))).toBe(
				true,
			);
			expect(cookies.some((cookie) => cookie.includes("HttpOnly"))).toBe(
				true,
			);
		});

		it("Returns 401 for an unknown email", async () => {
			const res = await request(app).post("/auth/login").send({
				email: "unknown@example.com",
				password: "secret123",
			});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe("Invalid credentials");
		});

		it("Returns 401 for a wrong password", async () => {
			await request(app).post("/auth/register").send({
				email: "login2@example.com",
				username: "login2",
				password: "secret123",
			});

			const res = await request(app).post("/auth/login").send({
				email: "login2@example.com",
				password: "wrongpassword",
			});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe("Invalid credentials");
		});

		it("Returns 409 when already authenticated", async () => {
			await request(app).post("/auth/register").send({
				email: "guarded3@example.com",
				username: "guarded3",
				password: "secret123",
			});
			const loginRes = await request(app).post("/auth/login").send({
				email: "guarded3@example.com",
				password: "secret123",
			});

			const res = await request(app)
				.post("/auth/login")
				.set("Cookie", loginRes.headers["set-cookie"])
				.send({
					email: "guarded3@example.com",
					password: "secret123",
				});

			expect(res.status).toBe(409);
		});
	});

	describe("POST /auth/logout", () => {
		it("Returns 401 when not authenticated", async () => {
			const res = await request(app).post("/auth/logout");

			expect(res.status).toBe(401);
		});

		it("Clears the token cookie when authenticated", async () => {
			await request(app).post("/auth/register").send({
				email: "logout1@example.com",
				username: "logout1",
				password: "secret123",
			});
			const loginRes = await request(app).post("/auth/login").send({
				email: "logout1@example.com",
				password: "secret123",
			});

			const res = await request(app)
				.post("/auth/logout")
				.set("Cookie", loginRes.headers["set-cookie"]);

			expect(res.status).toBe(200);
			const cookies = res.get("Set-Cookie") ?? [];
			expect(
				cookies.some(
					(cookie) =>
						cookie.startsWith("token=;") ||
						cookie.includes("Expires=Thu, 01 Jan 1970"),
				),
			).toBe(true);
		});
	});
});
