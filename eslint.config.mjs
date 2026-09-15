// ESLint flat config. `next lint` je uklonjen u Next 16 — eslint se zove
// izravno (vidi `scripts.lint` u package.json).
import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // CLAUDE.md §Konvencije: nikad `any`. Greška, ne upozorenje.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // `scripts/` su CLI alati — stdout im je izlazni kanal, ne ostatak otklanjanja
    // pogrešaka.
    files: ["scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
];

export default config;
