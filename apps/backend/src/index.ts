import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import tokenRouter from "./routes/token.js";
import meRouter from "./routes/me.js";
import missionsRouter from "./routes/missions.js";
import achievementsRouter from "./routes/achievements.js";
import leaderboardRouter from "./routes/leaderboard.js";

// 起動時に必須の環境変数を確認（未設定なら即終了）
const REQUIRED_ENV = ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT ?? 3001;

// cloudflared / リバースプロキシ経由のX-Forwarded-Forを信頼
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

// /api/token: Discord OAuthコード交換。ブルートフォース対策のため厳しく制限
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

// /api/me: ユーザー登録・更新。セッションごとに1回程度なので適度に制限
const meLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

// /api/achievements: ミッション達成記録。スパム投稿対策
const achievementsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

// 全体共通の緩やかな制限
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

app.use(globalLimiter);

app.use("/api/token", tokenLimiter, tokenRouter);
app.use("/api/me", meLimiter, meRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/achievements", achievementsLimiter, achievementsRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
