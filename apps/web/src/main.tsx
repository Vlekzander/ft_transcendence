import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./style.css";
import { hello } from "@ft_transcendence/shared";

const router = createBrowserRouter([
	{
		path: "/",
		element: <div className="bg-red-500">Une page</div>,
	},
	{
		path: "/test",
		element: <div className="bg-green-500">Une autre page</div>,
	},
	{
		path: "/shared",
		element: <div className="bg-blue-500">{hello("shared")}</div>,
	},
]);

const root = document.getElementById("root");

if (!root) throw new Error("root not found in DOM");

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
