import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
	const { status } = useAuth();

	if (status === "loading") return null;
	if (status === "unauthenticated") return <Navigate to="/" replace />;
	return <Outlet />;
}

export function RequireGuest() {
	const { status } = useAuth();

	if (status === "loading") return null;
	if (status === "authenticated") return <Navigate to="/" replace />;
	return <Outlet />;
}
