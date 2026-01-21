// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "index.ts",
      "rootStore.example.ts",
      "nativewind-env.d.ts",
      "patches/*",
      "bun.lock",
      "eslint.config.js",
    ],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    plugins: {
      "react-hooks": require("eslint-plugin-react-hooks"),
    },
    rules: {
      // Formatting nits the sorter doesn't fix
      "comma-spacing": ["warn", { before: false, after: true }],
      // React recommended rules (only those not already covered by expo config)
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "off", // React 17+ JSX transform
      "react/react-in-jsx-scope": "off",

      // Enforce React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);
