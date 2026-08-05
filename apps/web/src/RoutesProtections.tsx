import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { API_URL } from "./config";
import { DEFAULT_ERROR } from "./utils/api.utils";

export type AuthType = "loading" | "auth" | "guest";

//WARN: USING TEMP ROUTE /auth/whoami
export function useAuthStatus() {
	const [status, setStatus] = useState<AuthType>("loading");

	useEffect(() => {
		fetch(`${API_URL}/auth/whoami`, { credentials: "include" })
			.then((res) => {
				if (!res.ok) throw new Error(DEFAULT_ERROR);
				return res.json();
			})
			.then((data) => {
				setStatus(data.authenticated ? "auth" : "guest");
			})
			.catch(() => {
				setStatus("guest");
			});
	}, []);
	return status;
}

export function RequireAuth() {
	const status = useAuthStatus();

	if (status === "loading") return null;
	if (status === "guest") return <Navigate to="/" replace />;
	return <Outlet />;
}

export function RequireGuest() {
	const status = useAuthStatus();

	if (status === "loading") return null;
	if (status === "auth") return <Navigate to="/" replace />;
	return <Outlet />;
}
