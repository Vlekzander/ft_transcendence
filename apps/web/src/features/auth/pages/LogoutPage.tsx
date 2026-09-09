import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function LogoutPage() {
	const { logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		const doLogout = async () => {
			await logout();
			navigate("/", { replace: true });
		};
		doLogout();
	}, [logout]);
	return null;
}
