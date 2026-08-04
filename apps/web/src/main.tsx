import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./style.css";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./Layout";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				path: "/",
				element: <div className="bg-red-500">Une page</div>,
			},
			{
				path: "/register",
				element: <RegisterPage />,
			},
		],
	},
]);

const root = document.getElementById("root");

if (!root) throw new Error("root not found in DOM");

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
