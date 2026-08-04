import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

//WARN: USING TEMP ROUTE /auth/whoami
export function RequireAuth() {
	const [ok, setOk] = useState<boolean | null>(null);

	useEffect(() => {
		fetch("http://localhost:3000/auth/whoami", { credentials: "include" })
			.then((res) => setOk(res.ok))
			.catch(() => setOk(false));
	}, []);

	if (ok === null) return null;
	if (!ok) return <Navigate to="/" replace />;
	return <Outlet />;
}

//WARN: USING TEMP ROUTE /auth/whoami
export function RequireGuest() {
	const [ok, setOk] = useState<boolean | null>(null);

	useEffect(() => {
		fetch("http://localhost:3000/auth/whoami", { credentials: "include" })
			.then((res) => setOk(res.ok))
			.catch(() => setOk(false));
	}, []);

	if (ok === null) return null;
	if (!ok) return <Outlet />;
	return <Navigate to="/" replace />;
}
