import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		ignores: ["dist/**", "node_modules/**"],
	},
	{
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
];
