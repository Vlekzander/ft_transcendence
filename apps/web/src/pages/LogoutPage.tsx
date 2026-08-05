import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { API_URL } from "../config";

export default function LogoutPage() {
	const [done, setDone] = useState(false);

	useEffect(() => {
		const logout = async () => {
			try {
				await fetch(`${API_URL}/auth/logout`, {
					method: "POST",
					credentials: "include",
				});
			} finally {
				setDone(true);
			}
		};

		logout();
	}, []);
	if (!done) return null;
	return <Navigate to="/" replace />;
}
