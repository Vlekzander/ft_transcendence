import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./style.css";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./Layout";
import { RequireAuth, RequireGuest } from "./RoutesProtections";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import UserPage from "./pages/UserPage";
import NotFoundPage from "./pages/NotFoundPage";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { WS_URL } from "./config";
import TestWsPage from "./pages/TestWsPage";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				element: <RequireAuth />,
				children: [],
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
	<WebSocketProvider wsUrl={WS_URL}>
		<RouterProvider router={router} />
	</WebSocketProvider>,
);
