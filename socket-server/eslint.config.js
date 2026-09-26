import js from "@eslint/js";
import globals from "globals";

// Lint rules of the chat/presence server: the recommended JavaScript set, Node globals.
export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node, ecmaVersion: 2024, sourceType: "module" } },
];
