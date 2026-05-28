import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
  {
    rules: {
      // マウント時のデータ取得で setState を呼ぶ標準的なパターンを許容
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
