import base from "../../base-eslint.config.js";

export default [
	{
		ignores: ["tests/**"],
	},
	...base,
	{
		files: ["**/*.ts"],
		rules: {
			"no-console": "off",
		},
	},
];
