import type { UserResponseDTO } from "@ft_transcendence/shared";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { API_URL } from "../../../config";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
	user: UserResponseDTO | null;
	status: AuthStatus;
	refreshUser: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserResponseDTO | null>(null);
	const [status, setStatus] = useState<AuthStatus>("loading");
	const [isLogginOut, setIsLogginOut] = useState(false);

	const refreshUser = useCallback(async () => {
		if (isLogginOut) return;
		try {
			setStatus("loading");

			const response = await fetch(`${API_URL}/auth/whoami`, {
				credentials: "include",
			});

			if (!response.ok) {
				setStatus("unauthenticated");
				setUser(null);
				return;
			}

			const data = await response.json();
			if (!data.authenticated || !data.user) {
				setStatus("unauthenticated");
				setUser(null);
				return;
			}
			setStatus("authenticated");
			setUser(data.user);
		} catch {
			setStatus("unauthenticated");
			setUser(null);
		}
	}, [isLogginOut]);

	const logout = useCallback(async () => {
		setIsLogginOut(true);
		try {
			await fetch(`${API_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
		} finally {
			setUser(null);
			setStatus("unauthenticated");
			setIsLogginOut(false);
		}
	}, []);

	useEffect(() => {
		const initializeAuth = async () => {
			await refreshUser();
		};
		initializeAuth();
	}, [refreshUser]);

	const value: AuthContextValue = useMemo(
		() => ({
			user,
			status,
			refreshUser,
			logout,
		}),
		[user, status, refreshUser, logout],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
