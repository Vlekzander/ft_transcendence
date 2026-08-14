import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./style.css";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./Layout";
import { RequireAuth, RequireGuest } from "./RoutesProtections";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import UserPage from "./pages/UserPage";

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
				path: "/",
				element: <div className="bg-red-500">Une page</div>,
			},
			{
				path: "/logout",
				element: <LogoutPage />,
			},
			{
				path: "/user",
				element: <UserPage />,
			},
		],
	},
]);

const root = document.getElementById("root");

if (!root) throw new Error("root not found in DOM");

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
