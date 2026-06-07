import base from "../../base-eslint.config.js";

export default [
	...base,
	{
		files: ["**/*.ts"],
		rules: {
			"no-console": "off",
		},
	},
];
