import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./styles/global.css";
import { WS_URL } from "./config";
import Layout from "./Layout";
import {
	RequireAuth,
	RequireGuest,
} from "./features/auth/components/AuthGuard";
import RegisterPage from "./features/auth/pages/RegisterPage";
import LoginPage from "./features/auth/pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import LogoutPage from "./features/auth/pages/LogoutPage";
import UserPage from "./features/user/pages/UserPage";
import TestWsPage from "./features/websocket/pages/TestWsPage";
import { WebSocketProvider } from "./features/websocket/context/WebSocketContext";
import { AuthProvider } from "./features/auth/context/AuthContext";
import AccountPage from "./features/user/pages/AccountPage";
import { FriendProvider } from "./features/friends/context/FriendContext";
import FriendsPage from "./features/friends/pages/FriendsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import MsgPage, { MsgRedirect } from "./features/msg/pages/MsgPage";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				element: <RequireAuth />,
				children: [
					{
						path: "/account",
						element: <AccountPage />,
					},
					{
						path: "/friends",
						element: <FriendsPage />,
					},
					{
						path: "/msg",
						element: <MsgPage />,
					},
					{
						path: "/msg/:uuid",
						element: <MsgRedirect />,
					},
				],
			},
			{
				element: <RequireGuest />,
				children: [
					{
						path: "/register",
						element: <RegisterPage />,
					},
					{
						path: "/login",
						element: <LoginPage />,
					},
				],
			},
			{
				path: "*",
				element: <NotFoundPage />,
			},
			{
				path: "privacy",
				element: <PrivacyPolicy />,
			},
			{
				path: "tos",
				element: <TermsOfService />,
			},
			{
				path: "/not-found",
				element: <NotFoundPage />,
			},
			{
				path: "/",
				element: <div className="bg-red-500">Une page</div>,
			},
			{
				path: "/logout",
				element: <LogoutPage />,
			},
			{
				path: "/user/:uuid",
				element: <UserPage />,
			},

			{
				path: "/testws",
				element: <TestWsPage />,
			},
		],
	},
]);

const root = document.getElementById("root");

if (!root) throw new Error("root not found in DOM");

ReactDOM.createRoot(root).render(
	<AuthProvider>
		<FriendProvider>
			<WebSocketProvider wsUrl={WS_URL}>
				<RouterProvider router={router} />
			</WebSocketProvider>
		</FriendProvider>
	</AuthProvider>,
);
